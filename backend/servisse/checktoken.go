package servisse

import (
	"errors"
	"net/http"

	db "social-network/app/cration"
)

func IsHaveToken(r *http.Request) (string, string, int, error) {
	sesiontoken, err := r.Cookie("SessionToken")
	if err != nil || sesiontoken.Value == "" || !db.HaveToken(sesiontoken.Value) {
		return "", "", 0,errors.New("Unauthorized")
	}
	id := db.GetId("sessionToken", sesiontoken.Value)
	name ,avatar := db.GetUserInfo(id)
	return name, avatar ,id, nil
}
