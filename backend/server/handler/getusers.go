package handler

import (
	"encoding/json"
	"net/http"

	db "social-network/app/cration"
	"social-network/utils"
)

// GetUsers handles the request to get all users with their avatars
func GetUsers(w http.ResponseWriter, r *http.Request) {
	// Get search query parameter
	searchQuery := r.URL.Query().Get("search")

	var users []utils.UserProfile
	var err error

	if searchQuery != "" {
		// Search users by first name or last name
		users, err = db.SearchUsersByName(searchQuery)
	} else {
		// Get all users
		users, err = db.GetAllUsersWithAvatars()
	}

	if err != nil {
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
