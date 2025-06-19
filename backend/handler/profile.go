package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	db "social-network/Database/cration"
	"social-network/servisse"
	"social-network/utils"
)

func Profile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Method not allowed",
		})
		return
	}

	// Validate session token and get current user info
	_, _, _, err := servisse.IsHaveToken(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Unauthorized",
		})
		return
	}

	// Get current user ID from session token
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
	if currentUserID == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Invalid session token",
		})
		return
	}

	// Parse request body
	var requestData struct {
		Action    string `json:"action"`            // "get_profile" or "update_privacy"
		UserID    string `json:"user_id,omitempty"` // Target user ID to view
		IsPrivate *bool  `json:"is_private,omitempty"`
	}

	err = json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		// If no body or empty body, default to getting current user's profile
		requestData.Action = "get_profile"
		requestData.UserID = strconv.Itoa(currentUserID)
	}

	// Determine target user ID
	var targetUserID int
	if requestData.UserID != "" {
		targetUserID, err = strconv.Atoi(requestData.UserID)
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

	// Handle privacy update (only for current user)
	if requestData.Action == "update_privacy" && requestData.IsPrivate != nil {
		if targetUserID != currentUserID {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Cannot update privacy settings for other users",
			})
			return
		}

		// Update user privacy setting
		err = db.UpdateUserPrivacy(targetUserID, *requestData.IsPrivate)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Failed to update privacy setting",
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  true,
			"message": "Privacy setting updated successfully",
		})
		return
	}

	// Get target user profile
	userProfile, err := db.GetUserProfile(targetUserID)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "User Not found",
		})
		return
	}

	// Check if the profile is private and if current user can view it
	isOwnProfile := targetUserID == currentUserID
	canViewFullProfile := isOwnProfile || !userProfile.IsPrivate

	if !canViewFullProfile {
		// Return basic profile info for private profiles
		basicProfile := map[string]interface{}{
			"first_name": userProfile.FirstName,
			"last_name":  userProfile.LastName,
			"nickname":   userProfile.Nickname,
			"avatar":     userProfile.Avatar,
			"is_private": userProfile.IsPrivate,
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":          true,
			"profile":         basicProfile,
			"posts":           []interface{}{}, // Empty posts array
			"is_own_profile":  false,
			"is_private_view": true, //  this is a private profile view
		})
		return
	}

	// Get user's posts (only if can view full profile)
	var userPosts []utils.Postes
	if canViewFullProfile {
		userPosts, err = db.GetPostsByUserId(targetUserID, currentUserID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Failed to get user posts",
			})
			return
		}
	}

	// Return full profile data and posts
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          true,
		"profile":         userProfile,
		"posts":           userPosts,
		"is_own_profile":  isOwnProfile,
		"is_private_view": false,
	})
}
