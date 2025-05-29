package handler

import (
	"fmt"
	"net/http"
	"strings"

	db "social-network/Database/cration"
	"social-network/utils"
)

func Login(w http.ResponseWriter, r *http.Request) {
	// Enable CORS for this endpoint
	EnableCORS(w, r)

	if r.Method == "OPTIONS" {
		return
	}

	if r.Method == "POST" {
		// Parse form data
		err := r.ParseForm()
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(`{"error": "Failed to parse form data", "status":false}`))
			return
		}

		email := r.FormValue("email")
		password := r.FormValue("password")
		w.Header().Set("Content-Type", "application/json")
		var boo bool
		typ := ""
		var hashedPassword string
		if strings.Contains(email, "@") {
			boo = db.CheckInfo(email, "email")
			typ = "email"
		} else {
			boo = db.CheckInfo(email, "nikname")
			typ = "nikname"
		}

		if !boo {
			hashedPassword, err = db.Getpasswor(typ, email)
		}

		if boo || err != nil || !utils.ComparePassAndHashedPass(hashedPassword, password) {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Invalid ` + typ + ` or password", "status":false}`))
			return
		}
		SessionToken, erre := utils.GenerateSessionToken()
		if erre != nil {
			fmt.Println("err f sition")
			return
		}
		err = db.Updatesession(typ, SessionToken, email) ////email mmkin ikon nikname mmkin ikon email
		if err != nil {
			fmt.Println("ERRORE", err)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "SessionToken",
			Value:    SessionToken,
			Path:     "/",
			HttpOnly: true,
			Secure:   false, // Set to true in production with HTTPS
			SameSite: http.SameSiteLaxMode,
		})

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Login successful", "status":true}`))
		// fmt.Println("Email:", email, "Password:", password)

	}
}
