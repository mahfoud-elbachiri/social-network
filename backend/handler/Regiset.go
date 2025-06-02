package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	db "social-network/Database/cration"
	"social-network/utils"
)

type User struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	Nickname  string `json:"nickname"`
}

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		message := ""
		var info User
		errore := json.NewDecoder(r.Body).Decode(&info)
		if errore != nil {
			fmt.Println(errore)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Invalid request body"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		validatEmail := db.CheckInfo(info.Email, "email")
		if validatEmail {
			message = "Email already exists"
		}

		validatNikname := db.CheckInfo(info.Nickname, "nikname")
		if validatNikname {
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
		var err error
		info.Password, err = utils.HashPassword(info.Password)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Internal server error"})
			return
		}
		err = db.Insertuser(info.FirstName, info.LastName, info.Email, info.Gender, info.Age, info.Nickname, info.Password)
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
