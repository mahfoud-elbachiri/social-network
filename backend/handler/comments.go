package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	db "social-network/Database/cration"
	"social-network/servisse"
	"social-network/utils"
)

func Comments(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		w.Header().Set("Content-Type", "application/json")
		var err error
		idpost := utils.Jsncomment{}
		err = json.NewDecoder(r.Body).Decode(&idpost)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "Invalid JSON", "status":false}`))
			return
		}
		id, err := strconv.Atoi(idpost.ID)
		if err != nil {
			w.WriteHeader(http.StatusUnprocessableEntity) // 422
			w.Write([]byte(`{"error": "ID must be a number", "status":false}`))
			return
		}

		_, _, _, err = servisse.IsHaveToken(r)
		if err != nil {
			fmt.Println("token not found")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "` + err.Error() + `", "status":false ,"token":false}`))
			return
		}
		token, _ := r.Cookie("SessionToken")
		userid := db.GetId("sessionToken", token.Value)
		allcoments, err := db.SelectComments(id, userid)
		if err != nil {
			fmt.Println("err select")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error": "` + err.Error() + `", "status":false}`))
			return
		}

		// Send only the comments array as JSON
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(allcoments)
	}
}

func Sendcomment(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		w.Header().Set("Content-Type", "application/json")
		_, _, _, ishave := servisse.IsHaveToken(r)
		if ishave != nil {
			fmt.Println("token not found")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "` + ishave.Error() + `", "status":false, "tocken":false}`))
			return
		}

		content := r.FormValue("content")
		postID := r.FormValue("post_id")

		var avatarPath string
		file, handler, err := r.FormFile("avatar")
		if err == nil && handler != nil {
			defer file.Close()
			os.MkdirAll("../frontend/public/avatars2", 0o755)
 
			savePath := "../frontend/public/avatars2/" + handler.Filename
			newFile, err := os.Create(savePath)
			if err == nil {
				io.Copy(newFile, file)
				newFile.Close()

				avatarPath = "avatars2/" + handler.Filename
			}
		}

		// Validation: Either content or image must be provided (or both)
		if content == "" && avatarPath == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "Either text content or image must be provided", "status":false}`))
			return
		}

		tocken, _ := r.Cookie("SessionToken")
		id := db.GetId("sessionToken", tocken.Value)

		postid, err := strconv.Atoi(postID)
		if err != nil {
			
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "` + err.Error() + `", "status":false}`))
			return
		}
		err = db.SelectPostid(postid)
		if err != nil {
			fmt.Println("err postid")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "` + err.Error() + `", "status":false}`))
			return
		}
		err = db.InsertComment(postid, id, content, avatarPath)
		if err != nil {
			fmt.Println("err insert", err)
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "` + err.Error() + `", "status":false}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"error": "comment sent", "status":true}`))
	}
}
