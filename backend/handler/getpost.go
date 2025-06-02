package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	db "social-network/Database/cration"
	"social-network/servisse"
)

var (
	end = 0
	str = 0
)

func Getpost(w http.ResponseWriter, r *http.Request) {
	var err error
	_, err = servisse.IsHaveToken(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error": "Unauthorized", "status":false, "tocken":false}`))
		return
	}
	token, _ := r.Cookie("SessionToken")

	userid := db.GetId("sessionToken", token.Value)

	w.Header().Set("Content-Type", "application/json")

	lastdata := r.FormValue("lastdata")

	if lastdata == "true" {
		str, err = db.Getlastid()
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error": "404", "status":false,"tocken":false}`))
			return
		}
	}
	fmt.Println("Getpost: ", str)

	if str == 0 {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	if str > 10 {
		end = str - 10
	} else if str < 10 {
		end = 0
	}

	Postes, err := db.GetPostes(str, end, userid)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error", "status":false, "tocken":false}`))
		return
	}

	if end-10 >= 0 {
		str = end
		end -= 10
	} else {
		str = end
		end = 0
	}
	fmt.Println("Getpost: ", Postes)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(Postes)
}
