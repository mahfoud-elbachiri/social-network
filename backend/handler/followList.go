package handler

import (
	"encoding/json"
	"net/http"

	db "social-network/Database/cration"
	"social-network/servisse"
)

 func GetFollowDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Method not allowed",
		})
		return
	}

 
	_, _, err := servisse.IsHaveToken(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Unauthorized",
		})
		return
	}

	 
	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "No session token found",
		})
		return
	}

   currentUserID := db.GetId("sessionToken", cookie.Value)

 
	followers, err := db.GetfollowerList(currentUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Failed to get followers",
		 })
		return
	}

	following, err := db.GetFollowinglist(currentUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Failed to get following",
		})
		return
	}

 
	w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]interface{}{
		"status": true,
	  	"followers": map[string]interface{}{
			"users": followers.Users,
			"count": followers.Count,
		},
		"following": map[string]interface{}{
			"users": following.Users,
			"count": following.Count,
		},
	})
}