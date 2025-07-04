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
	Type      string `json:"type"` // "follow" or "group"
}

type GroupInviteNotification struct {
	ID               int    `json:"id"`
	GroupID          int    `json:"group_id"`
	GroupName        string `json:"group_name"`
	InviterFirstName string `json:"inviter_first_name"`
	InviterLastName  string `json:"inviter_last_name"`
	InviterNickname  string `json:"inviter_nickname"`
	InviterAvatar    string `json:"inviter_avatar"`
	CreatedAt        string `json:"created_at"`
	Type             string `json:"type"` // "group"
}

type GroupJoinRequestNotification struct {
	ID                 int    `json:"id"`
	GroupID            int    `json:"group_id"`
	GroupName          string `json:"group_name"`
	RequesterFirstName string `json:"requester_first_name"`
	RequesterLastName  string `json:"requester_last_name"`
	RequesterNickname  string `json:"requester_nickname"`
	RequesterAvatar    string `json:"requester_avatar"`
	RequesterUserID    int    `json:"requester_user_id"`
	CreatedAt          string `json:"created_at"`
	Type               string `json:"type"` // "group_join"
}

type EventNotification struct {
	EventTitle       string `json:"event_title"`
	GroupName        string `json:"group_name"`
	CreatorFirstName string `json:"creator_first_name"`
	CreatorLastName  string `json:"creator_last_name"`
	CreatorNickname  string `json:"creator_nickname"`
	CreatorAvatar    string `json:"creator_avatar"`
	CreatedAt        string `json:"created_at"`
	Type             string `json:"type"` // "event"
}

// GetNotifications fetches pending follow requests and group invitations for the current user
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

	// Get follow request notifications
	followQuery := `
		SELECT u.id, u.first_name, u.last_name, u.nikname, u.avatar, f.created_at
		FROM users u 
		INNER JOIN followers f ON u.id = f.follower_id 
		WHERE f.following_id = ? AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`

	followRows, err := db.DB.Query(followQuery, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to fetch follow notifications", nil)
		return
	}
	defer followRows.Close()

	var notifications []interface{}

	// Process follow notifications
	for followRows.Next() {
		var notification FollowNotification
		var avatar *string

		err := followRows.Scan(&notification.ID, &notification.FirstName, &notification.LastName,
			&notification.Nickname, &avatar, &notification.CreatedAt)
		if err != nil {
			utils.JsonResponse(w, http.StatusInternalServerError, "Error reading follow notifications", nil)
			return
		}

		if avatar != nil {
			notification.Avatar = *avatar
		} else {
			notification.Avatar = ""
		}
		notification.Type = "follow"

		notifications = append(notifications, notification)
	}

	// Get group invitation notifications
	groupQuery := `
		SELECT gm.id, gm.group_id, g.title, u.first_name, u.last_name, u.nikname, u.avatar, gm.created_at
		FROM group_members gm
		INNER JOIN groups g ON gm.group_id = g.id
		INNER JOIN users u ON g.creator_id = u.id
		WHERE gm.user_id = ? AND gm.status = 'invited'
		ORDER BY gm.created_at DESC
	`

	groupRows, err := db.DB.Query(groupQuery, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to fetch group notifications", nil)
		return
	}
	defer groupRows.Close()

	// Process group notifications
	for groupRows.Next() {
		var notification GroupInviteNotification
		var avatar *string

		err := groupRows.Scan(&notification.ID, &notification.GroupID, &notification.GroupName,
			&notification.InviterFirstName, &notification.InviterLastName, &notification.InviterNickname,
			&avatar, &notification.CreatedAt)
		if err != nil {
			utils.JsonResponse(w, http.StatusInternalServerError, "Error reading group notifications", nil)
			return
		}

		if avatar != nil {
			notification.InviterAvatar = *avatar
		} else {
			notification.InviterAvatar = ""
		}
		notification.Type = "group"

		notifications = append(notifications, notification)
	}

	// Get group join request notifications (for group creators)
	groupJoinQuery := `
		SELECT gm.id, gm.group_id, g.title, u.first_name, u.last_name, u.nikname, u.avatar, gm.user_id, gm.created_at
		FROM group_members gm
		INNER JOIN groups g ON gm.group_id = g.id
		INNER JOIN users u ON gm.user_id = u.id
		WHERE g.creator_id = ? AND gm.status = 'requested'
		ORDER BY gm.created_at DESC
	`

	groupJoinRows, err := db.DB.Query(groupJoinQuery, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to fetch group join notifications", nil)
		return
	}
	defer groupJoinRows.Close()

	// Process group join request notifications
	for groupJoinRows.Next() {
		var notification GroupJoinRequestNotification
		var avatar *string

		err := groupJoinRows.Scan(&notification.ID, &notification.GroupID, &notification.GroupName,
			&notification.RequesterFirstName, &notification.RequesterLastName, &notification.RequesterNickname,
			&avatar, &notification.RequesterUserID, &notification.CreatedAt)
		if err != nil {
			utils.JsonResponse(w, http.StatusInternalServerError, "Error reading group join notifications", nil)
			return
		}

		if avatar != nil {
			notification.RequesterAvatar = *avatar
		} else {
			notification.RequesterAvatar = ""
		}
		notification.Type = "group_join"

		notifications = append(notifications, notification)
	}

	// Get event notifications (recent events in groups where user is a member)
	eventQuery := `
		SELECT ge.title, g.title, u.first_name, u.last_name, u.nikname, u.avatar, ge.created_at
		FROM group_events ge
		INNER JOIN groups g ON ge.group_id = g.id
		INNER JOIN users u ON ge.created_by = u.id
		INNER JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = ? AND gm.status = 'accepted' 
		AND ge.created_by != ? 
		AND ge.created_at > datetime('now', '-7 days')
		ORDER BY ge.created_at DESC
		LIMIT 10
	`

	eventRows, err := db.DB.Query(eventQuery, currentUserID, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to fetch event notifications", nil)
		return
	}
	defer eventRows.Close()

	// Process event notifications
	for eventRows.Next() {
		var notification EventNotification
		var avatar *string

		err := eventRows.Scan(&notification.EventTitle, &notification.GroupName,
			&notification.CreatorFirstName, &notification.CreatorLastName,
			&notification.CreatorNickname, &avatar, &notification.CreatedAt)
		if err != nil {
			utils.JsonResponse(w, http.StatusInternalServerError, "Error reading event notifications", nil)
			return
		}

		if avatar != nil {
			notification.CreatorAvatar = *avatar
		} else {
			notification.CreatorAvatar = ""
		}
		notification.Type = "event"

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

// AcceptGroupInvitation accepts a group invitation
func AcceptGroupInvitation(w http.ResponseWriter, r *http.Request) {
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
		GroupID string `json:"group_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	groupID, err := strconv.Atoi(requestData.GroupID)
	if err != nil || groupID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid group ID", nil)
		return
	}

	query := `UPDATE group_members SET status = 'accepted' WHERE group_id = ? AND user_id = ? AND status = 'invited'`
	result, err := db.DB.Exec(query, groupID, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to accept group invitation", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Group invitation not found or already processed", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Group invitation accepted successfully", nil)
}

// RejectGroupInvitation rejects a group invitation
func RejectGroupInvitation(w http.ResponseWriter, r *http.Request) {
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
		GroupID string `json:"group_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	groupID, err := strconv.Atoi(requestData.GroupID)
	if err != nil || groupID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid group ID", nil)
		return
	}

	// Delete the group invitation
	query := `DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'invited'`
	result, err := db.DB.Exec(query, groupID, currentUserID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to reject group invitation", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Group invitation not found", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Group invitation rejected successfully", nil)
}

// AcceptGroupJoinRequest accepts a group join request
func AcceptGroupJoinRequest(w http.ResponseWriter, r *http.Request) {
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
		GroupID     string `json:"group_id"`
		RequesterID string `json:"requester_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	groupID, err := strconv.Atoi(requestData.GroupID)
	if err != nil || groupID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid group ID", nil)
		return
	}

	requesterID, err := strconv.Atoi(requestData.RequesterID)
	if err != nil || requesterID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid requester ID", nil)
		return
	}

	// Verify that the current user is the group creator
	var creatorID int
	err = db.DB.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to verify group creator", nil)
		return
	}

	if creatorID != currentUserID {
		utils.JsonResponse(w, http.StatusForbidden, "Only group creator can accept join requests", nil)
		return
	}

	query := `UPDATE group_members SET status = 'accepted' WHERE group_id = ? AND user_id = ? AND status = 'requested'`
	result, err := db.DB.Exec(query, groupID, requesterID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to accept group join request", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Group join request not found or already processed", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Group join request accepted successfully", nil)
}

// RejectGroupJoinRequest rejects a group join request
func RejectGroupJoinRequest(w http.ResponseWriter, r *http.Request) {
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
		GroupID     string `json:"group_id"`
		RequesterID string `json:"requester_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid request data", nil)
		return
	}

	groupID, err := strconv.Atoi(requestData.GroupID)
	if err != nil || groupID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid group ID", nil)
		return
	}

	requesterID, err := strconv.Atoi(requestData.RequesterID)
	if err != nil || requesterID <= 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Invalid requester ID", nil)
		return
	}

	// Verify that the current user is the group creator
	var creatorID int
	err = db.DB.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to verify group creator", nil)
		return
	}

	if creatorID != currentUserID {
		utils.JsonResponse(w, http.StatusForbidden, "Only group creator can reject join requests", nil)
		return
	}

	// Delete the join request
	query := `DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'requested'`
	result, err := db.DB.Exec(query, groupID, requesterID)
	if err != nil {
		utils.JsonResponse(w, http.StatusInternalServerError, "Failed to reject group join request", nil)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.JsonResponse(w, http.StatusBadRequest, "Group join request not found", nil)
		return
	}

	utils.JsonResponse(w, http.StatusOK, "Group join request rejected successfully", nil)
}
