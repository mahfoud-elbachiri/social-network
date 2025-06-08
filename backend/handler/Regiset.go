package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

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

		// Handle avatar upload
		var avatarPath string
		file, handler, err := r.FormFile("avatar")
		if err == nil && handler != nil {
			defer file.Close()

			// Create avatars directory in Next.js public folder (correct path from backend/main/)
			nextjsAvatarsDir := "../../public/avatars"
			os.MkdirAll(nextjsAvatarsDir, 0o755)

			// Save to Next.js public directory but store relative path in DB
			fullPath := nextjsAvatarsDir + "/" + handler.Filename
			avatarPath = "avatars/" + handler.Filename // This is what gets stored in DB (without "public/" prefix)

			dst, err := os.Create(fullPath)
			if err != nil {
				// Log the error and continue without avatar
				println("Error creating avatar file:", err.Error())
				avatarPath = ""
			} else {
				defer dst.Close()
				_, err = io.Copy(dst, file)
				if err != nil {
					// Log the error and continue without avatar
					println("Error copying avatar file:", err.Error())
					avatarPath = "" // fallback if copy fails
				}
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
