package db

import (
	"fmt"
	"log"
	"strconv"
	"time"
)

func Insertuser(first_name string, last_name string, email string, gender string, age string, nikname string, password string, avatar string, about_me string, is_private bool) error {
	infiuser, err := DB.Prepare("INSERT INTO users (first_name, last_name, email, gender, age, nikname, password, avatar, about_me, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	age_int, err := strconv.Atoi(age)
	if err != nil {
		return err
	}
	_, err = infiuser.Exec(first_name, last_name, email, gender, age_int, nikname, password, avatar, about_me, is_private)
	if err != nil {
		return err
	}
	return nil
}

func InsertPostes(user_id int, title string, content string, privacy string, avatar string) error {
	created_at := time.Now().Format("2006-01-02 15:04:05")

	info, err := DB.Prepare("INSERT INTO postes (user_id,title,content,created_at,avatar,privacy) VALUES (?,?,?,?,?,?)")
	if err != nil {
		fmt.Println("==> E : ", err)
		return err
	}
	_, err = info.Exec(user_id, title, content, created_at, avatar, privacy)
	if err != nil {
		return err
	}
	return nil
}

// InsertPostesWithID inserts a post and returns the post ID
func InsertPostesWithID(user_id int, title string, content string, privacy string, avatar string) (int, error) {
	created_at := time.Now().Format("2006-01-02 15:04:05")

	info, err := DB.Prepare("INSERT INTO postes (user_id,title,content,created_at,avatar,privacy) VALUES (?,?,?,?,?,?)")
	if err != nil {
		fmt.Println("==> E : ", err)
		return 0, err
	}

	result, err := info.Exec(user_id, title, content, created_at, avatar, privacy)
	if err != nil {
		return 0, err
	}

	// Get the last inserted ID
	postID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(postID), nil
}

// InsertPrivatePostPermission adds permission for a user to see a private post
func InsertPrivatePostPermission(postID int, userID int) error {
	query := "INSERT INTO private_post_permissions (post_id, user_id) VALUES (?, ?)"
	_, err := DB.Exec(query, postID, userID)
	return err
}

func InsertComment(post_id int, user_id int, comment string, avatar string) error {
	created_at := time.Now().Format("2006-01-02 15:04:05")
	info, err := DB.Prepare("INSERT INTO comments (post_id , user_id , comment , avatar , created_at) VALUES (?,?,?,?,?)")
	if err != nil {
		return err
	}
	_, err = info.Exec(post_id, user_id, comment, avatar, created_at)
	if err != nil {
		return err
	}
	return nil
}

func UpdateTocken(tocken string) error {
	info, err := DB.Prepare("UPDATE users SET sessionToken = NULL WHERE sessionToken = ?")
	if err != nil {
		return err
	}
	_, err = info.Exec(tocken)
	if err != nil {
		return err
	}
	return nil
}

func InsertMessages(sender string, receiver string, content string, time string) error {
	// time := time.Now().Format("2006-01-02 15:04:05")

	info, err := DB.Prepare("INSERT INTO messages (sender ,receiver ,text ,time) VALUES (?,?,?,?)")
	if err != nil {
		return err
	}
	_, err = info.Exec(sender, receiver, content, time)
	if err != nil {
		return err
	}
	return nil
}
func InsertMssgGRoup(Group_id,user_id int,mssg string,time string)error{
	info ,err :=DB.Prepare("INSERT INTO group_chat_messages(group_id,user_id,content,sent_at)VALUES(?,?,?,?)")
		if err != nil {
		return err
	}
	_, err = info.Exec(Group_id, user_id, mssg, time)
	if err != nil {
		return err
	}
	return  nil
}

func InsertFOllow(follower_id int, following_id int, status string) error {
	query := "INSERT INTO followers (follower_id , following_id , status) VALUES (?,?,?)"

	info, err := DB.Prepare(query)
	if err != nil {
	//	fmt.Println("publicddd")
		return err
	}

	_, err = info.Exec(follower_id, following_id, status)
	if err != nil {
		return err
	}

	return err
}

func DeleteFollow(followerId, followingId int) {
	stmt, err := DB.Prepare("DELETE FROM followers WHERE follower_id = ? AND following_id = ?")
	if err != nil {
		log.Println("Error preparing delete statement:", err)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(followerId, followingId)
	if err != nil {
		log.Println("Error deleting follow:", err)
	}
}
// GroupChatMessage represents a chat message in a group
type GroupChatMessage struct {
	ID        int    `json:"id"`
	GroupID   int    `json:"group_id"`
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Type      string `json:"type"`
}

// InsertGroupChatMessage inserts a new chat message into the database
func InsertGroupChatMessage(groupID, userID int, message, timestamp string) error {
	query := `
		INSERT INTO group_chat_messages (group_id, user_id, message, timestamp)
		VALUES (?, ?, ?, ?)
	`
	
	_, err := DB.Exec(query, groupID, userID, message, timestamp)
	if err != nil {
		return fmt.Errorf("failed to insert group chat message: %w", err)
	}
	
	return nil
}

// GetGroupChatMessages retrieves all chat messages for a specific group
func GetGroupChatMessages(groupID int) ([]GroupChatMessage, error) {
	query := `
		SELECT 
			gcm.id,
			gcm.group_id,
			gcm.user_id,
			u.nikname as username,
			gcm.message,
			gcm.timestamp
		FROM group_chat_messages gcm
		JOIN users u ON gcm.user_id = u.id
		WHERE gcm.group_id = ?
		ORDER BY gcm.timestamp ASC
	`
	
	rows, err := DB.Query(query, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to query group chat messages: %w", err)
	}
	defer rows.Close()
	
	var messages []GroupChatMessage
	for rows.Next() {
		var msg GroupChatMessage
		err := rows.Scan(
			&msg.ID,
			&msg.GroupID,
			&msg.UserID,
			&msg.Username,
			&msg.Message,
			&msg.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan group chat message: %w", err)
		}
		
		msg.Type = "chat_message"
		messages = append(messages, msg)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over group chat messages: %w", err)
	}
	
	return messages, nil
}

// IsUserGroupMember checks if a user is a member of a specific group
func IsUserGroupMember(userID, groupID int) (bool, error) {
	query := `
		SELECT COUNT(*) 
		FROM groups g
		LEFT JOIN group_members gm ON g.id = gm.group_id
		WHERE g.id = ? AND (
			g.creator_id = ? OR 
			(gm.user_id = ? AND gm.status = 'accepted')
		)
	`
	
	var count int
	err := DB.QueryRow(query, groupID, userID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check group membership: %w", err)
	}
	
	return count > 0, nil
}

// CreateGroupChatTable creates the group_chat_messages table if it doesn't exist
func CreateGroupChatTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS group_chat_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			message TEXT NOT NULL,
			timestamp DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`
	
	_, err := DB.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create group_chat_messages table: %w", err)
	}
	
	return nil
}

// GetGroupMembers retrieves all members of a specific group (for WebSocket broadcasting)
func GetGroupMembers(groupID int) ([]int, error) {
	query := `
		SELECT DISTINCT user_id
		FROM (
			SELECT creator_id as user_id FROM groups WHERE id = ?
			UNION
			SELECT user_id FROM group_members WHERE group_id = ? AND status = 'accepted'
		)
	`
	
	rows, err := DB.Query(query, groupID, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to get group members: %w", err)
	}
	defer rows.Close()
	
	var members []int
	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("failed to scan group member: %w", err)
		}
		members = append(members, userID)
	}
	
	return members, nil
}