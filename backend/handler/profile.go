package handler

import (
	"encoding/json"
	"net/http"

	db "social-network/Database/cration"
	"social-network/servisse"
)

func Profile(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		// Validate session token and get user info
		_, _, err := servisse.IsHaveToken(r)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Unauthorized",
			})
			return
		}

		// Get user ID from session token
		cookie, err := r.Cookie("SessionToken")
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "No session token found",
			})
			return
		}

		userID := db.GetId("sessionToken", cookie.Value)
		if userID == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": false,
				"error":  "Invalid session token",
			})
			return
		}

		// Parse request body
		var requestData struct {
			Action    string `json:"action"` // "get_profile" or "update_privacy"
			IsPrivate *bool  `json:"is_private,omitempty"`
		}

		err = json.NewDecoder(r.Body).Decode(&requestData)
		if err != nil {
			// If no body or empty body, default to getting profile
			requestData.Action = "get_profile"
		}

		if requestData.Action == "update_privacy" && requestData.IsPrivate != nil {
			// Update user privacy setting
			err = db.UpdateUserPrivacy(userID, *requestData.IsPrivate)
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
		} else {
			// Default: Get user profile information and posts
			userProfile, err := db.GetUserProfile(userID)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"status": false,
					"error":  "Failed to get user profile",
				})
				return
			}

			// Get user's posts
			userPosts, err := db.GetPostsByUserId(userID)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"status": false,
					"error":  "Failed to get user posts",
				})
				return
			}

			// Return profile data and posts
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":  true,
				"profile": userProfile,
				"posts":   userPosts,
			})
		}
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": false,
			"error":  "Method not allowed",
		})
	}
}
