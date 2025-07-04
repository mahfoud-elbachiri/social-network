package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	db "social-network/Database/cration"
	"social-network/servisse"
)

func GetPostsOfUser(w http.ResponseWriter, r *http.Request) {
	// Check authentication
	_, _, _, err := servisse.IsHaveToken(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error": "Unauthorized", "status":false, "token":false}`))
		return
	}

	// Get current user ID from session token
	token, _ := r.Cookie("SessionToken")
	currentUserID := db.GetId("sessionToken", token.Value)

	w.Header().Set("Content-Type", "application/json")

	// Parse request body to get target user ID
	var requestData struct {
		UserID string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Invalid request body",
		})
		return
	}

	// Convert target user ID to integer
	targetUserID, err := strconv.Atoi(requestData.UserID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Invalid user ID",
		})
		return
	}

	// Check if the target user exists
	exists := db.UserExists(targetUserID)
	if !exists {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "User not found",
		})
		return
	}

	// Check if current user can view the target user's posts
	canViewPosts := db.CanViewProfile(currentUserID, targetUserID)
	if !canViewPosts {
		// Return indicator that this is a private profile
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":     true,
			"posts":      []interface{}{},
			"is_private": true,
		})
		return
	}

	// Get posts by user ID
	posts, err := db.GetPostsByUserId(targetUserID, currentUserID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Failed to fetch posts",
		})
		return
	}

	// Return the posts
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": true,
		"posts":  posts,
	})
}