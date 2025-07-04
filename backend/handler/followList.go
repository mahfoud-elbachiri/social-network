package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	db "social-network/Database/cration"
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

	userIDStr := r.URL.Query().Get("id")
	var targetUserID int

	if userIDStr != "" {

		targetUserID, err = strconv.Atoi(userIDStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Invalid user ID",
			})
			return
		}
	} else {
		targetUserID = currentUserID
	}

	followers, err := db.GetfollowerList(targetUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Failed to get followers",
		})
		return
	}

	following, err := db.GetFollowinglist(targetUserID)
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
