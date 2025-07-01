package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	db "social-network/Database/cration"
	"social-network/servisse"
	"social-network/utils"
)

func Post(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		_, _, _, ishave := servisse.IsHaveToken(r)
		if ishave != nil {
			fmt.Println("token not found POST")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "401", "status":false , "tocken":false}`))
			return
		}
		title := r.FormValue("title")
		content := r.FormValue("content")
		privacy := r.FormValue("privacy")
		selectedFollowers := r.FormValue("selected_followers")

		var avatarPath string

		uniqueID := time.Now().Format("20060102150405")

		file, handler, err := r.FormFile("avatar")
		if err == nil && handler != nil {
			defer file.Close()

			avatarDir := utils.GetImageSavePath("avatars2")
			os.MkdirAll(avatarDir, 0o755)

			// os.MkdirAll("../frontend/public/avatars2/", 0o755)

			savePath := filepath.Join(avatarDir, uniqueID+handler.Filename)
			newFile, err := os.Create(savePath)
			if err == nil {
				io.Copy(newFile, file)
				newFile.Close()

				avatarPath = "avatars2/" + uniqueID + handler.Filename
			}
		}

		if title == "" || content == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "400", "status":false ,"tocken":true}`))
			return
		}

		tocken, _ := r.Cookie("SessionToken")
		user_id := db.GetId("sessionToken", tocken.Value)

		// Insert the post first
		postID, errore := db.InsertPostesWithID(user_id, title, content, privacy, avatarPath)

		if errore != nil {
			fmt.Println("===> er : ", errore)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "500", "status":false ,"tocken":true}`))
			fmt.Println("Error inserting post:", errore)
			return
		}

		// If it's a private post and followers are selected, add permissions
		if privacy == "private" && selectedFollowers != "" {
			var followerIDs []int
			err := json.Unmarshal([]byte(selectedFollowers), &followerIDs)
			if err == nil && len(followerIDs) > 0 {
				for _, followerID := range followerIDs {
					err := db.InsertPrivatePostPermission(postID, followerID)
					if err != nil {
						fmt.Printf("Error adding permission for follower %d: %v\n", followerID, err)
					}
				}
			}
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"error": "200", "status":true ,"tocken":true}`))

	}
}
