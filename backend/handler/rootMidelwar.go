package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	db "social-network/Database/cration"
)

// AuthMiddleware checks if the user is authenticated
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("SessionToken")

		if err != nil || cookie.Value == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{"login": false})
			return
		}
		fmt.Println("Cookie Value:", cookie.Value)

		if !db.HaveToken(cookie.Value) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{"login": false})
			return
		}
		next.ServeHTTP(w, r)
	})
}
