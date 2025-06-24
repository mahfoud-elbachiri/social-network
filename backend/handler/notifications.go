package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	db "social-network/Database/cration"
	"social-network/utils"
)

type FollowNotification struct {
	ID        int    `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	CreatedAt string `json:"created_at"`
}

// GetNotifications fetches pending follow requests for the current user
func GetNotifications(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		utils.JsonResponse(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	token, err := r.Cookie("SessionToken")
	if err != nil {
		utils.JsonResponse(w, http.StatusUnauthorized, "No session token found", nil)
		return
	}

	currentUserID := db.GetId("sessionToken", token.Value)

	query := `
		SELECT u.id, u.first_name, u.last_name, u.nikname, u.avatar, f.created_at
		FROM users u 
		INNER JOIN followers f ON u.id = f.follower_id 
		WHERE f.following_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`

	rows, err := db.DB.Query(query, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to fetch notifications", nil)
		return
	}
	defer rows.Close()

	var notifications []FollowNotification
	for rows.Next() {
		var notification FollowNotification
		var avatar *string
		
		err := rows.Scan(&notification.ID, &notification.FirstName, &notification.LastName, 
			&notification.Nickname, &avatar, &notification.CreatedAt)
		if err != nil {
			utils.JsonResponse(w, http.StatusInternalServerError, "Error reading notifications", nil)
			return
		}

		if avatar != nil {
			notification.Avatar = *avatar
		} else {
			notification.Avatar = ""
		}

		notifications = append(notifications, notification)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        true,
		"notifications": notifications,
		"count":         len(notifications),
	})
}






// AcceptFollowRequest accepts a pending follow request
func AcceptFollowRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		utils.JsonResponse(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	token, err := r.Cookie("SessionToken")
	if err != nil {
		utils.JsonResponse(w, http.StatusUnauthorized, "No session token found", nil)
		return
	}

	currentUserID := db.GetId("sessionToken", token.Value)

	var requestData struct {
		FollowerID string `json:"follower_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	followerID, err := strconv.Atoi(requestData.FollowerID)
	if err != nil || followerID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid follower ID", nil)
		return
	}

	query := `UPDATE followers SET status = 'accepted' WHERE follower_id = ? AND following_id = ? AND status = 'pending'`
	result, err := db.DB.Exec(query, followerID, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to accept follow request", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Follow request not found or already processed", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Follow request accepted successfully", nil)
}





// RejectFollowRequest rejects a pending follow request
func RejectFollowRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		utils.JsonResponse(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	token, err := r.Cookie("SessionToken")
	if err != nil {
		utils.JsonResponse(w, http.StatusUnauthorized, "No session token found", nil)
		return
	}

	currentUserID := db.GetId("sessionToken", token.Value)

	var requestData struct {
		FollowerID string `json:"follower_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	followerID, err := strconv.Atoi(requestData.FollowerID)
	if err != nil || followerID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid follower ID", nil)
		return
	}

	// Delete the pending follow request
	query := `DELETE FROM followers WHERE follower_id = ? AND following_id = ? AND status = 'pending'`
	result, err := db.DB.Exec(query, followerID, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to reject follow request", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Follow request not found", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Follow request rejected successfully", nil)
}
