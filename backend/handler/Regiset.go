package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	db "social-network/Database/cration"
	"social-network/utils"
)

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		message := ""

		// Parse multipart form (10MB max memory)
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid form data"})
			return
		}

		// Get form values
		firstName := r.FormValue("firstName")
		lastName := r.FormValue("lastName")
		email := r.FormValue("email")
		password := r.FormValue("password")
		age := r.FormValue("age")
		gender := r.FormValue("gender")
		nickname := r.FormValue("nickname")
		aboutMe := r.FormValue("about_me")
		isPrivate := r.FormValue("is_private") == "true" // Convert to boolean

		// Handle avatar upload (simplified)
		var avatarPath string

		uniqueID := time.Now().Format("20060102150405")

		// Try to get the uploaded file
		file, handler, err := r.FormFile("avatar")
		if err == nil && handler != nil {
			// User uploaded a file
			defer file.Close()

			avatarDir := utils.GetImageSavePath("avatars")
			os.MkdirAll(avatarDir, 0o755)

			// Save the file to public/avatars folder
			savePath := filepath.Join(avatarDir, uniqueID+handler.Filename)
			newFile, err := os.Create(savePath)
			
			if err == nil {
				// Copy the uploaded file to our folder
				io.Copy(newFile, file)
				newFile.Close()

				// Store just "avatars/filename.jpg" in database (not full path)
				avatarPath = "avatars/" + uniqueID + handler.Filename
			}
		}

		// Validate email and nickname
		if db.CheckInfo(email, "email") {
			message = "Email already exists"
		}
		if db.CheckInfo(nickname, "nikname") {
			if message != "" {
				message = "Email and nickname already exist"
			} else {
				message = "Nickname already exists"
			}
		}
		if message != "" {
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": message})
			return
		}

		// Hash password
		password, err = utils.HashPassword(password)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Internal server error"})
			return
		}

		// Insert user (update your Insertuser to accept avatarPath and aboutMe)
		err = db.Insertuser(firstName, lastName, email, gender, age, nickname, password, avatarPath, aboutMe, isPrivate)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Internal server error"})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": ""})

		BroadcastUsers()
	}
}
