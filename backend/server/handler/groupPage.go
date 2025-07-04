package handler

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	db "social-network/app/cration"
	"social-network/Database/sqlite"
	"social-network/utils"
)

type Event struct {
	ID           int
	Title        string
	Description  string
	DateTime     string
	UserResponse string
}

type Group struct {
	ID          int
	Title       string
	Description string
	CreatorID   int
	IsCreator   bool
	IsMember    bool
	IsRequested bool
	IsInvited   bool
}

type JoinRequest struct {
	UserID   int
	Username string
	Status   string
}

type Member struct {
	Username string
	Role     string
}

type InvitableUser struct {
	UserID   int
	Username string
	Invited  bool
	Name string
}

type GroupPost struct {
	ID        int
	GroupID   int
	UserID    int
	Content   string
	Username  string
	CreatedAt string
	ImageURL  *string
	Comments  []GroupComment
}

type GroupComment struct {
	ID        int
	PostID    int
	UserID    int
	Content   string
	Username  string
	ImageURL  *string
	CreatedAt string
}

type CreateGroup struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func HomepageGroup(w http.ResponseWriter, r *http.Request) {
	dvb := sqlite.GetDB()
	cookie, _ := r.Cookie("SessionToken")
	userID := db.GetId("sessionToken", cookie.Value)
	username := db.GetUsernameByToken(cookie.Value)
	dvb.QueryRow("SELECT username FROM users WHERE id = ?", userID).Scan(&username)

	groups, _ := GetGroups(userID)

	data := struct {
		Username string
		UserID   int

		Groups []Group
	}{
		Username: username,
		UserID:   userID,
		Groups:   groups,
	}
	json.NewEncoder(w).Encode(data)
}

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	dvb := sqlite.GetDB()

	cookie, _ := r.Cookie("SessionToken")

	userID := db.GetId("SessionToken", cookie.Value)

	if r.Method != http.MethodPost {
		return
	}

	var group CreateGroup
	err := json.NewDecoder(r.Body).Decode(&group)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error": "Invalid JSON", "status":false}`))
		return
	}

	tx, err := dvb.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	res, err := tx.Exec(`INSERT INTO groups (title, description, creator_id) VALUES (?, ?, ?)`,
		group.Title, group.Description, userID,
	)
	if err != nil {
		log.Println("Insert group error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	groupID, err := res.LastInsertId()
	if err != nil {
		log.Println("Get last insert ID error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`
        INSERT INTO group_members (group_id, user_id, role, status)
        VALUES (?, ?, 'admin', 'accepted')`,
		groupID, userID,
	)
	if err != nil {
		log.Println("Insert group member error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		log.Println("Transaction commit error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
}

func GetGroups(userID int) ([]Group, error) {
	dvb := sqlite.GetDB()

	rows, err := dvb.Query(`
        SELECT g.id, g.title, g.description,
               CASE WHEN g.creator_id = ? THEN 1 ELSE 0 END AS is_creator,
               CASE WHEN gm.user_id IS NOT NULL AND gm.status = 'accepted' THEN 1 ELSE 0 END AS is_member,
               CASE WHEN gm.user_id IS NOT NULL AND gm.status = 'requested' THEN 1 ELSE 0 END AS is_requested,
               CASE WHEN gm.user_id IS NOT NULL AND gm.status = 'invited' THEN 1 ELSE 0 END AS is_invited
        FROM groups g
        LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
    `, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		var isCreatorInt, isMemberInt, isRequestedInt, isInvitedInt int
		err := rows.Scan(&g.ID, &g.Title, &g.Description, &isCreatorInt, &isMemberInt, &isRequestedInt, &isInvitedInt)
		if err != nil {
			return nil, err
		}
		g.IsCreator = isCreatorInt == 1
		g.IsMember = isMemberInt == 1
		g.IsRequested = isRequestedInt == 1
		g.IsInvited = isInvitedInt == 1
		groups = append(groups, g)
	}
	return groups, nil
}

func JoinGroupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	userID := db.GetId("SessionToken", cookie.Value)
	if userID == 0 {
		http.Error(w, "Unauthorized - invalid session", http.StatusUnauthorized)
		return
	}

	var data struct {
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if data.GroupID == 0 {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	dvb := sqlite.GetDB()

	var exists bool
	err = dvb.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
		)
	`, data.GroupID, userID).Scan(&exists)
	if err != nil {
		log.Println("Error checking group membership:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Already a member", http.StatusBadRequest)
		return
	}

	_, err = dvb.Exec(`
		INSERT INTO group_members (group_id, user_id, role, status)
		VALUES (?, ?, 'member', 'requested')
	`, data.GroupID, userID)
	if err != nil {
		log.Println("Error inserting group member:", err)
		http.Error(w, "Failed to join group", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Join request submitted"}`))
}

func AcceptJoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	adminID := db.GetId("SessionToken", cookie.Value)

	var data struct {
		UserID  int `json:"user_id"`
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if data.UserID == 0 || data.GroupID == 0 {
		http.Error(w, "Missing user_id or group_id", http.StatusBadRequest)
		return
	}

	var creatorID int
	err = dvb.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, data.GroupID).Scan(&creatorID)
	if err != nil {
		log.Println("Group lookup error:", err)
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	if creatorID != adminID {
		http.Error(w, "You are not authorized to accept join requests for this group", http.StatusForbidden)
		return
	}

	_, err = dvb.Exec(`
		UPDATE group_members
		SET status = 'accepted'
		WHERE group_id = ? AND user_id = ?
	`, data.GroupID, data.UserID)
	if err != nil {
		log.Println("Error updating group member:", err)
		http.Error(w, "Failed to accept request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "User accepted"}`))
}

func RejectJoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	adminID := db.GetId("SessionToken", cookie.Value)

	var data struct {
		UserID  int `json:"user_id"`
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if data.UserID == 0 || data.GroupID == 0 {
		http.Error(w, "Missing user_id or group_id", http.StatusBadRequest)
		return
	}

	var creatorID int
	err = dvb.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, data.GroupID).Scan(&creatorID)
	if err != nil {
		log.Println("Group not found:", err)
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}
	if creatorID != adminID {
		http.Error(w, "You are not authorized to reject members for this group", http.StatusForbidden)
		return
	}

	_, err = dvb.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, data.GroupID, data.UserID)
	if err != nil {
		log.Println("Failed to reject join request:", err)
		http.Error(w, "Failed to reject request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Join request rejected"}`))
}

func GroupInviteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session token
	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()
	senderID := db.GetId("SessionToken", cookie.Value)

	// Decode incoming JSON
	var data struct {
		UserID  int `json:"user_id"`
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}
	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if data.UserID == 0 || data.GroupID == 0 {
		http.Error(w, "Missing user_id or group_id", http.StatusBadRequest)
		return
	}

	// Check if user is group creator
	var creatorID int
	err = dvb.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, data.GroupID).Scan(&creatorID)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Check if sender is accepted member
	var count int
	err = dvb.QueryRow(`
		SELECT COUNT(*) FROM group_members
		WHERE group_id = ? AND user_id = ? AND status = 'accepted'
	`, data.GroupID, senderID).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	isAcceptedMember := count > 0

	if senderID != creatorID && !isAcceptedMember {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Check if target user is already in the group
	var status string
	err = dvb.QueryRow(`
		SELECT status FROM group_members 
		WHERE group_id = ? AND user_id = ?
	`, data.GroupID, data.UserID).Scan(&status)

	if err != sql.ErrNoRows {
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		http.Error(w, "User is already in the group or already invited/requested", http.StatusConflict)
		return
	}

	// Safe to invite
	_, err = dvb.Exec(`
		INSERT INTO group_members (group_id, user_id, role, status)
		VALUES (?, ?, 'member', 'invited')
	`, data.GroupID, data.UserID)
	if err != nil {
		http.Error(w, "Failed to invite user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"User invited successfully"}`))
}

func AcceptInviteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	userID := db.GetId("sessionToken", cookie.Value)

	var data struct {
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil || data.GroupID == 0 {
		http.Error(w, "Invalid or missing group_id", http.StatusBadRequest)
		return
	}

	_, err = dvb.Exec(`UPDATE group_members SET status = 'accepted' WHERE group_id = ? AND user_id = ? AND status = 'invited'`, data.GroupID, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Invite accepted"}`))
}

func RejectInviteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	userID := db.GetId("sessionToken", cookie.Value)

	var data struct {
		GroupID int `json:"group_id"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil || data.GroupID == 0 {
		http.Error(w, "Invalid or missing group_id", http.StatusBadRequest)
		return
	}

	_, err = dvb.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'invited'`, data.GroupID, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Invite rejected"}`))
}

func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	userID := db.GetId("sessionToken", cookie.Value)

	var data struct {
		GroupID     int    `json:"group_id"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Datetime    string `json:"datetime"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	eventTime, err := time.Parse("2006-01-02T15:04", data.Datetime)
	if err != nil {
		http.Error(w, "Invalid datetime format", http.StatusBadRequest)
		return
	}

	if eventTime.Before(time.Now()) {
		http.Error(w, "Cannot create an event in the past", http.StatusBadRequest)
		return
	}
	if data.GroupID == 0 || data.Title == "" || data.Datetime == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	_, err = dvb.Exec(`
		INSERT INTO group_events (group_id, title, description, datetime, created_by)
		VALUES (?, ?, ?, ?, ?)`,
		data.GroupID, data.Title, data.Description, data.Datetime, userID,
	)
	if err != nil {
		log.Println("Insert error:", err)
		http.Error(w, "Could not create event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Event created successfully"}`))
}

func EventResponseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()

	userID := db.GetId("sessionToken", cookie.Value)

	var data struct {
		EventID  int    `json:"event_id"`
		Response string `json:"response"`
	}
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	err = json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&data)
	if err != nil || data.EventID == 0 || data.Response == "" {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}
	_, err = dvb.Exec(`
		INSERT INTO event_responses (event_id, user_id, response)
		VALUES (?, ?, ?)
		ON CONFLICT(event_id, user_id)
		DO UPDATE SET response = excluded.response, responded_at = CURRENT_TIMESTAMP
	`, data.EventID, userID, data.Response)
	if err != nil {
		log.Println("Event response insert error:", err)
		http.Error(w, "Could not save response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Response recorded successfully"}`))
}

func CreateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()
	userID := db.GetId("sessionToken", cookie.Value)

	// Parse multipart form data (for file uploads)
	err = r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	// Get form values
	groupIDStr := r.FormValue("group_id")
	content := r.FormValue("content")

	if groupIDStr == "" || content == "" {
		http.Error(w, "Missing group_id or content", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	var imageURL *string = nil

	// Handle image upload if present
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		// Validate file type
		if !strings.HasPrefix(header.Header.Get("Content-Type"), "image/") {
			http.Error(w, "Only image files are allowed", http.StatusBadRequest)
			return
		}

		// Create uploads directory if it doesn't exist
		uploadsDir := utils.GetImageSavePath("uploads/group_posts")
		if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
			log.Println("Failed to create uploads directory:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%d_%s%s", groupID, time.Now().Unix(), generateRandomString(8), ext)
		filePath := filepath.Join(uploadsDir, filename)

		// Create the file
		dst, err := os.Create(filePath)
		if err != nil {
			log.Println("Failed to create file:", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Copy uploaded file to destination
		if _, err := io.Copy(dst, file); err != nil {
			log.Println("Failed to save file:", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}

		// Set image URL (relative path for serving)
		imageURLStr := fmt.Sprintf("/uploads/group_posts/%s", filename)
		imageURL = &imageURLStr
	} else if err != http.ErrMissingFile {
		// Error other than missing file
		log.Println("Error reading file:", err)
		http.Error(w, "Error processing image", http.StatusBadRequest)
		return
	}

	// Insert post into database
	var query string
	var args []interface{}

	if imageURL != nil {
		query = `INSERT INTO group_posts (group_id, user_id, content, image_url) VALUES (?, ?, ?, ?)`
		args = []interface{}{groupID, userID, content, *imageURL}
	} else {
		query = `INSERT INTO group_posts (group_id, user_id, content) VALUES (?, ?, ?)`
		args = []interface{}{groupID, userID, content}
	}

	_, err = dvb.Exec(query, args...)
	if err != nil {
		log.Println("CreateGroupPostHandler insert error:", err)
		http.Error(w, "Unable to create post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Post created successfully"}`))
}

// Helper function to generate random string for filename
func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func CreateGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized - missing session", http.StatusUnauthorized)
		return
	}

	dvb := sqlite.GetDB()
	userID := db.GetId("sessionToken", cookie.Value)

	// Parse multipart form data (for file uploads)
	err = r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	// Get form values
	postIDStr := r.FormValue("post_id")
	groupIDStr := r.FormValue("group_id")
	content := r.FormValue("content")

	if postIDStr == "" || groupIDStr == "" || content == "" {
		http.Error(w, "Missing post_id, group_id, or content", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post_id", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	var imageURL *string = nil

	// Handle image upload if present
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		// Validate file type
		if !strings.HasPrefix(header.Header.Get("Content-Type"), "image/") {
			http.Error(w, "Only image files are allowed", http.StatusBadRequest)
			return
		}

		// Create uploads directory if it doesn't exist

		uploadsDir := utils.GetImageSavePath("uploads/group_comments")
		if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
			log.Println("Failed to create uploads directory:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%d_%d_%d_%s%s", groupID, postID, time.Now().Unix(), generateRandomString(8), ext)
		filePath := filepath.Join(uploadsDir, filename)

		// Create the file
		dst, err := os.Create(filePath)
		if err != nil {
			log.Println("Failed to create file:", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Copy uploaded file to destination
		if _, err := io.Copy(dst, file); err != nil {
			log.Println("Failed to save file:", err)
			http.Error(w, "Failed to save image", http.StatusInternalServerError)
			return
		}

		// Set image URL (relative path for serving)
		imageURLStr := fmt.Sprintf("/uploads/group_comments/%s", filename)
		imageURL = &imageURLStr
	} else if err != http.ErrMissingFile {
		// Error other than missing file
		log.Println("Error reading file:", err)
		http.Error(w, "Error processing image", http.StatusBadRequest)
		return
	}

	// Insert comment into database
	var query string
	var args []interface{}

	if imageURL != nil {
		query = `INSERT INTO group_comments (post_id, user_id, content, image_url) VALUES (?, ?, ?, ?)`
		args = []interface{}{postID, userID, content, *imageURL}
	} else {
		query = `INSERT INTO group_comments (post_id, user_id, content) VALUES (?, ?, ?)`
		args = []interface{}{postID, userID, content}
	}

	_, err = dvb.Exec(query, args...)
	if err != nil {
		log.Println("CreateGroupCommentHandler insert error:", err)
		http.Error(w, "Unable to create comment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Comment created successfully"}`))
}

func GroupPageHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Get user ID from cookie
	dvb := sqlite.GetDB()
	cookie, _ := r.Cookie("SessionToken")

	userID := db.GetId("SessionToken", cookie.Value)

	// Step 2: Get group ID from URL
	groupIDStr := r.URL.Query().Get("id")
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Step 3: Fetch group info
	var group Group
	err = dvb.QueryRow(`SELECT id, title, description, creator_id FROM groups WHERE id = ?`, groupID).
		Scan(&group.ID, &group.Title, &group.Description, &group.CreatorID)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}
	group.IsCreator = group.CreatorID == userID

	// Step 4: Check if user is accepted member
	var exists int
	err = dvb.QueryRow(`
		SELECT COUNT(*) FROM group_members 
		WHERE group_id = ? AND user_id = ? AND status = 'accepted'
	`, groupID, userID).Scan(&exists)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	group.IsMember = exists > 0

	// Step 5: Only allow access if creator or member
	if !group.IsCreator && !group.IsMember {
		http.Error(w, "You are not a member of this group", http.StatusForbidden)
		return
	}

	// Step 6a: Fetch accepted group members
	rows, err := dvb.Query(`
		SELECT u.nikname, gm.role
		FROM users u
		JOIN group_members gm ON u.id = gm.user_id
		WHERE gm.group_id = ? AND gm.status = 'accepted'
	`, groupID)
	if err != nil {
		http.Error(w, "Unable to fetch members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var members []Member
	for rows.Next() {
		var m Member
		err := rows.Scan(&m.Username, &m.Role)
		if err != nil {
			http.Error(w, "Error reading members", http.StatusInternalServerError)
			return
		}
		members = append(members, m)
	}

	// Step 6b: Fetch join requests (only for group creator)
	var requestedMembers []JoinRequest
	if group.IsCreator {
		reqRows, err := dvb.Query(`
			SELECT u.id, u.nikname, gm.status
			FROM users u
			JOIN group_members gm ON u.id = gm.user_id
			WHERE gm.group_id = ? AND gm.status = 'requested'
		`, groupID)
		if err != nil {
			http.Error(w, "Unable to fetch join requests", http.StatusInternalServerError)
			return
		}
		defer reqRows.Close()

		for reqRows.Next() {
			var jr JoinRequest
			err := reqRows.Scan(&jr.UserID, &jr.Username, &jr.Status)
			if err != nil {
				http.Error(w, "Error reading join requests", http.StatusInternalServerError)
				return
			}
			requestedMembers = append(requestedMembers, jr)
		}
	}

	// Step 6c: Fetch invitable users (only for group creator)
	var invitableUsers []InvitableUser
	if group.IsCreator || group.IsMember {
		inviteRows, err := dvb.Query(`
			SELECT u.first_name , u.id, u.nikname,
			CASE WHEN gm.status IS NOT NULL THEN 1 ELSE 0 END AS invited
			FROM users u
			LEFT JOIN group_members gm ON gm.user_id = u.id AND gm.group_id = ?
			WHERE u.id != ? 
			  AND (gm.status IS NULL OR gm.status NOT IN ('accepted'))
		`, group.ID, userID)
		if err != nil {
			http.Error(w, "Unable to fetch invitable users", http.StatusInternalServerError)
			return
		}
		defer inviteRows.Close()

		for inviteRows.Next() {
			var u InvitableUser
			var invitedInt int
			err := inviteRows.Scan(&u.Name ,&u.UserID, &u.Username, &invitedInt)
			if err != nil {
				http.Error(w, "Error reading invitable users", http.StatusInternalServerError)
				return
			}
			u.Invited = invitedInt == 1
			invitableUsers = append(invitableUsers, u)
		}
	}

	// Step 7: Fetch group events and RSVP responses
	var events []Event
	eventRows, err := dvb.Query(`
		SELECT id, title, description, datetime 
		FROM group_events 
		WHERE group_id = ? 
		ORDER BY datetime ASC
	`, groupID)
	if err != nil {
		http.Error(w, "Unable to fetch group events", http.StatusInternalServerError)
		return
	}
	defer eventRows.Close()

	for eventRows.Next() {
		var ev Event
		err := eventRows.Scan(&ev.ID, &ev.Title, &ev.Description, &ev.DateTime)
		if err != nil {
			http.Error(w, "Error reading events", http.StatusInternalServerError)
			return
		}

		// Get user's response
		err = dvb.QueryRow(`
			SELECT response FROM event_responses 
			WHERE event_id = ? AND user_id = ?
		`, ev.ID, userID).Scan(&ev.UserResponse)
		if err != nil && err != sql.ErrNoRows {
			http.Error(w, "Error fetching event responses", http.StatusInternalServerError)
			return
		}

		events = append(events, ev)
	}

	// Step 8: Fetch group posts and comments (FIXED)
	var posts []GroupPost
	// In GroupPageHandler, update the query:
	postRows, err := dvb.Query(`
    SELECT p.id, p.group_id, p.user_id, p.content, p.created_at, u.nikname, p.image_url
    FROM group_posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.group_id = ?
    ORDER BY p.created_at DESC
`, groupID)
	if err != nil {
		log.Println("Failed to load posts:", err)
		http.Error(w, "Failed to load posts", http.StatusInternalServerError)
		return
	}
	defer postRows.Close()

	for postRows.Next() {
		var post GroupPost
		err := postRows.Scan(&post.ID, &post.GroupID, &post.UserID, &post.Content, &post.CreatedAt, &post.Username, &post.ImageURL)
		if err != nil {
			log.Println("Failed to read post:", err)
			http.Error(w, "Failed to read post", http.StatusInternalServerError)
			return
		}

		// Fetch comments for each post
		commentRows, err := dvb.Query(`
	SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.nikname, c.image_url
	FROM group_comments c
	JOIN users u ON c.user_id = u.id
	WHERE c.post_id = ?
	ORDER BY c.created_at ASC
`, post.ID)
		if err != nil {

			log.Println("Failed to load comments:", err)
			http.Error(w, "Failed to load comments", http.StatusInternalServerError)
			return
		}

		for commentRows.Next() {
			var comment GroupComment
			err := commentRows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.CreatedAt, &comment.Username, &comment.ImageURL)
			if err != nil {
				log.Println("Failed to read comment:", err)
				http.Error(w, "Failed to read comment", http.StatusInternalServerError)
				return
			}
			post.Comments = append(post.Comments, comment)
		}
		commentRows.Close()

		posts = append(posts, post)
	}
	postsJSON, err := json.MarshalIndent(posts, "", "  ")
	if err != nil {
		log.Println("Error marshaling posts for debug:", err)
	} else {
		log.Println("Posts data with comments:\n", string(postsJSON))
	}
	// Step 9: Render template with all group data
	data := struct {
		Group            Group
		Members          []Member
		IsAdmin          bool
		RequestedMembers []JoinRequest
		InvitableUsers   []InvitableUser
		Events           []Event
		Posts            []GroupPost
	}{
		Group:            group,
		Members:          members,
		IsAdmin:          group.IsCreator,
		RequestedMembers: requestedMembers,
		InvitableUsers:   invitableUsers,
		Events:           events,
		Posts:            posts,
	}
	json.NewEncoder(w).Encode(data)
}


// GetGroupChatHandler retrieves all chat messages for a specific group
func GetGroupChatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get group ID from query parameters
	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Get current user ID from session
	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := db.GetId("SessionToken", cookie.Value)
	if userID == 0 {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	// Check if user is a member of the group
	isMember, err := db.IsUserGroupMember(userID, groupID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "Access denied: You are not a member of this group", http.StatusForbidden)
		return
	}

	// Get chat messages for the group
	messages, err := db.GetGroupChatMessages(groupID)
	if err != nil {
		http.Error(w, "Failed to retrieve messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// SendGroupChatHandler handles sending a new chat message to a group
func SendGroupChatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		GroupID int    `json:"group_id"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.GroupID == 0 || req.Message == "" {
		http.Error(w, "Group ID and message are required", http.StatusBadRequest)
		return
	}

	// Get current user ID from session
	cookie, err := r.Cookie("SessionToken")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := db.GetId("SessionToken", cookie.Value)
	if userID == 0 {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	username := db.GetUsernameByToken(cookie.Value)
	if username == "" {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}

	// Check if user is a member of the group
	isMember, err := db.IsUserGroupMember(userID, req.GroupID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "Access denied: You are not a member of this group", http.StatusForbidden)
		return
	}

	// Insert message into database
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	err = db.InsertGroupChatMessage(req.GroupID, userID, req.Message, timestamp)
	if err != nil {
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	// Create WebSocket message for broadcast
	wsMessage := db.GroupChatMessage{
		GroupID:   req.GroupID,
		UserID:    userID,
		Username:  username,
		Message:   req.Message,
		Timestamp: timestamp,
		Type:      "chat_message",
	}

	// Broadcast to WebSocket clients in the same group
	BroadcastGroupChatMessage(wsMessage)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}