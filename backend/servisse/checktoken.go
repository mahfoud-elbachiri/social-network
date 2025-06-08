package servisse

import (
	"errors"
	"net/http"

	db "social-network/Database/cration"
)

func IsHaveToken(r *http.Request) (string, string, error) {
	sesiontoken, err := r.Cookie("SessionToken")
	if err != nil || sesiontoken.Value == "" || !db.HaveToken(sesiontoken.Value) {
		return "", "", errors.New("Unauthorized")
	}
	id := db.GetId("sessionToken", sesiontoken.Value)
	name ,avatar := db.GetUserInfo(id)
	return name, avatar , nil
}
