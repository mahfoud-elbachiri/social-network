package app

import (
	"database/sql"
	"fmt"

	"social-network/Database/sqlite"
	"social-network/utils"
)

var DB = sqlite.GetDB()

func GetFollowersUsers(id int) ([]string, error) {
	rows, err := DB.Query(`SELECT DISTINCT u.nikname
		FROM users u
		JOIN followers f ON (u.id = f.follower_id OR u.id = f.following_id)
		WHERE (f.following_id = ? OR f.follower_id = ?) 
  		AND f.status = 'accepted'
		AND u.id != ?

	`, id, id, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var nickname string
		if err := rows.Scan(&nickname); err != nil {
			return nil, err
		}
		users = append(users, nickname)
	}

	nUser, err := NewUser(users, id)
	if err != nil {
		return nil, err
	}

	return nUser, nil
}

func selectAllGrpIds() ([]int, error) {
	rows, err := DB.Query("SELECT id FROM groups")
	if err != nil {
		return nil, err
	}
	ids := []int{}
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func NewUser(users []string, id int) ([]string, error) {
	publicUser, err := GetAllPublicUsers()
	if err != nil {
		return nil, err
	}

	for _, pUser := range publicUser {
		if !contains(users, pUser) {
			users = append(users, pUser)
		}
	}

	msgUser, err := GetMsgUser(id)
	if err != nil {
		return nil, err
	}

	for _, mUser := range msgUser {
		if !contains(users, mUser) {
			users = append(users, mUser)
		}
	}

	return users, nil
}

func GetMsgUser(id int) ([]string, error) {
	username := GetUser(id)
	rows, err := DB.Query("SELECT sender FROM messages WHERE receiver = ? ;", username)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var users []string
	for rows.Next() {
		var receiver string
		if err := rows.Scan(&receiver); err != nil {
			return nil, err
		}
		users = append(users, receiver)
	}
	return users, nil
}

func GetAllPublicUsers() ([]string, error) {
	rows, err := DB.Query("SELECT nikname FROM users WHERE is_private = 0 ORDER BY nikname ASC;")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var nickname string
		if err := rows.Scan(&nickname); err != nil {
			return nil, err
		}
		users = append(users, nickname)
	}
	return users, nil
}

func GetAllPrivateUsers() ([]string, error) {
	rows, err := DB.Query("SELECT nikname FROM users WHERE is_private = 1 ORDER BY nikname ASC;")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var nickname string
		if err := rows.Scan(&nickname); err != nil {
			return nil, err
		}
		users = append(users, nickname)
	}
	return users, nil
}

func GetAllUsers() ([]string, error) {
	rows, err := DB.Query("SELECT nikname FROM users ORDER BY nikname ASC;")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []string
	for rows.Next() {
		var nickname string
		if err := rows.Scan(&nickname); err != nil {
			return nil, err
		}
		users = append(users, nickname)
	}
	return users, nil
}

func CheckInfo(info string, input string) bool { ////hna kanoxofo wax email ola wax nikname kayn 3la hsab input xno fiha wax email ola wax nikname
	var inter int
	quire := "SELECT COUNT(*) FROM users WHERE " + input + " = ?"
	err := DB.QueryRow(quire, info).Scan(&inter)
	if err != nil {
		fmt.Println(err)
		return false
	}
	return inter == 1
}

func Getpasswor(input string, typ string) (string, error) {
	var password string
	quire := "SELECT password FROM users WHERE " + input + " = ?"
	err := DB.QueryRow(quire, typ).Scan(&password)
	if err != nil {
		return "", err
	}
	return password, nil
}

func Updatesession(typ string, tocken string, input string) error {
	query := "UPDATE users SET sessionToken = $1 WHERE " + typ + " = $2"
	_, err := DB.Exec(query, tocken, input)
	if err != nil {
		return err
	}
	return nil
}

func HaveToken(tocken string) bool {
	var token int
	quire := "SELECT COUNT(*) FROM users WHERE sessionToken = ?"
	err := DB.QueryRow(quire, tocken).Scan(&token)
	if err != nil {
		return false
	}
	return token == 1
}

func GetUsernameByToken(tocken string) string {
	var username string
	quire := "SELECT nikname FROM users WHERE sessionToken = ?"
	err := DB.QueryRow(quire, tocken).Scan(&username)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	return username
}

func GetId(input string, tocken string) int {
	var id int
	quire := "SELECT id FROM users WHERE " + input + " = ?"
	err := DB.QueryRow(quire, tocken).Scan(&id)
	if err != nil {
		return 0
	}
	return id
}

func GetAvatar(username string) string {
	var avatar string
	quire := "SELECT avatar FROM users WHERE nikname = ?"
	err := DB.QueryRow(quire, username).Scan(&avatar)
	if err != nil {
		return ""
	}
	return avatar
}

func GetUserInfo(id int) (string, string) {
	var name, avatar string
	quire := "SELECT nikname, avatar FROM users WHERE id = ?"
	err := DB.QueryRow(quire, id).Scan(&name, &avatar)
	if err != nil {
		fmt.Println("Error getting user info:", err)
		return "", ""
	}
	//	fmt.Printf("User ID %d: name='%s', avatar='%s'\n", id, name, avatar)
	return name, avatar
}

func GetUser(id int) string {
	var name string
	quire := "SELECT nikname FROM users WHERE id = ?"
	err := DB.QueryRow(quire, id).Scan(&name)
	if err != nil {
		return ""
	}
	return name
}

// Helper function to check if user is following the post author
func IsFollowing(followerID, followingID int) bool {
	var exist bool
	query := "SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ? AND status = 'accepted')"
	DB.QueryRow(query, followerID, followingID).Scan(&exist)
	return exist
}

// Check if a user has permission to see a private post
func HasPrivatePostPermission(postID, userID int) bool {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM private_post_permissions WHERE post_id = ? AND user_id = ?)"
	DB.QueryRow(query, postID, userID).Scan(&exists)
	return exists
}

// Function to check if a user can view a post based on privacy settings
func CanViewPost(viewerID, postAuthorID int, privacy string, postID int) bool {
	// User can always see their own posts
	if viewerID == postAuthorID {
		return true
	}

	switch privacy {
	case "public":
		return true
	case "almost private":
		// Only followers can see
		return IsFollowing(viewerID, postAuthorID)
	case "private":
		// Only specifically selected followers can see
		return HasPrivatePostPermission(postID, viewerID)
	default:
		return false
	}
}

func GetPostes(str int, end int, userid int) ([]utils.Postes, error) {
	var postes []utils.Postes
	quire := "SELECT id, user_id, title, content, created_at, avatar, privacy FROM postes WHERE id > ? AND id <= ? ORDER BY created_at DESC"
	rows, err := DB.Query(quire, end, str)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var post utils.Postes
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt, &post.Avatar, &post.Privacy)
		if err != nil {
			return nil, err
		}

		// Check if user can view this post based on privacy settings
		if !CanViewPost(userid, post.UserID, post.Privacy, post.ID) {
			continue // Skip this post if user can't view it
		}

		post.Nembre, err = LenghtComent(post.ID)
		post.Username = GetUser(post.UserID)
		if post.Username == "" {
			return nil, err
		}

		// Get user's avatar
		_, userAvatar := GetUserInfo(post.UserID)
		post.UserAvatar = userAvatar

		postes = append(postes, post)
	}

	return postes, nil
}

func GetPostsByUserId(userId int, viewerID int) ([]utils.Postes, error) {
	var postes []utils.Postes
	quire := "SELECT id, user_id, title, content, created_at, avatar, privacy FROM postes WHERE user_id = ? ORDER BY created_at DESC"
	rows, err := DB.Query(quire, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var post utils.Postes
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt, &post.Avatar, &post.Privacy)
		if err != nil {
			return nil, err
		}

		// Check if viewer can see this post based on privacy settings
		if !CanViewPost(viewerID, post.UserID, post.Privacy, post.ID) {
			continue // Skip this post if viewer can't see it
		}

		post.Nembre, err = LenghtComent(post.ID)
		post.Username = GetUser(post.UserID)
		if post.Username == "" {
			return nil, err
		}

		// Get user's avatar
		_, userAvatar := GetUserInfo(post.UserID)
		post.UserAvatar = userAvatar

		postes = append(postes, post)
	}

	return postes, nil
}

func GetUserProfile(userId int) (*utils.UserProfile, error) {
	var profile utils.UserProfile
	query := "SELECT id, first_name, last_name, email, gender, age, nikname, avatar, about_me, is_private FROM users WHERE id = ?"
	err := DB.QueryRow(query, userId).Scan(
		&profile.ID,
		&profile.FirstName,
		&profile.LastName,
		&profile.Email,
		&profile.Gender,
		&profile.Age,
		&profile.Nickname,
		&profile.Avatar,
		&profile.AboutMe,
		&profile.IsPrivate,
	)
	if err != nil {
		fmt.Println("eerooor :", err)
		return nil, err
	}
	return &profile, nil
}

func LenghtComent(postid int) (nbr int, err error) {
	nbr = 0 // initialize the counter to 0
	quire := "SELECT COUNT(*) FROM comments WHERE post_id =?"
	err = DB.QueryRow(quire, postid).Scan(&nbr)
	if err != nil {
		return 0, err
	}
	return nbr, nil
}

func SelectComments(postid int, userid int) ([]utils.CommentPost, error) {
	var comments []utils.CommentPost
	quire := "SELECT id, post_id, user_id, comment, avatar, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC"
	rows, err := DB.Query(quire, postid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var comment utils.CommentPost
		err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.Avatar, &comment.CreatedAt)
		if err != nil {
			fmt.Println("moxkil f scan")
			return nil, err
		}

		comment.Username = GetUser(comment.UserID)
		comments = append(comments, comment)
	}

	return comments, nil
}

func SelectPostid(postid int) error {
	id := 0
	query := "SELECT id FROM postes WHERE id = ?"
	err := DB.QueryRow(query, postid).Scan(&id)
	if err != nil {
		return err
	}
	return nil
}

func SelectCommentid(commentid int) error {
	id := 0
	query := "SELECT id FROM comments WHERE id = ?"
	err := DB.QueryRow(query, commentid).Scan(&id)
	if err != nil {
		return err
	}
	return nil
}

func GetlastidChat(s string, r string) (int, error) {
	id := 0
	query := "SELECT id FROM messages WHERE sender = ? AND receiver = ? ORDER BY id DESC LIMIT 1"
	err := DB.QueryRow(query, s, r).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func Getlastid() (int, error) {
	id := 0
	query := "SELECT id FROM postes ORDER BY id DESC LIMIT 1"
	err := DB.QueryRow(query).Scan(&id)
	if err != nil {
		// If no rows found (empty table), return 0 without error
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, err
	}
	return id, nil
}

func SelecChats(sender string, receiver string, num int) ([]utils.Msg, error) {
	var msgs []utils.Msg

	quire := "SELECT sender, receiver, text, time FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY id DESC LIMIT 10 OFFSET ?"
	rows, err := DB.Query(quire, sender, receiver, receiver, sender, num)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var msg utils.Msg
		err := rows.Scan(&msg.Sender, &msg.Receiver, &msg.Text, &msg.Time)
		if err != nil {
			return nil, err
		}

		msgs = append(msgs, msg)

	}

	return msgs, nil
}

type UserLastMessage struct {
	User    string
	UserMsg []string
}

func GetLastMessage(allUsers []string) ([]UserLastMessage, error) {
	userLastContacts := make(map[string][]string)

	query := "SELECT sender, receiver FROM messages ORDER BY id DESC"
	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var sender, receiver string
		if err := rows.Scan(&sender, &receiver); err != nil {
			return nil, err
		}

		if !contains(userLastContacts[sender], receiver) {
			userLastContacts[sender] = append(userLastContacts[sender], receiver)
		}

		if !contains(userLastContacts[receiver], sender) {
			userLastContacts[receiver] = append(userLastContacts[receiver], sender)
		}
	}

	var result []UserLastMessage
	for _, user := range allUsers {
		result = append(result, UserLastMessage{
			User:    user,
			UserMsg: userLastContacts[user],
		})
	}

	return result, nil
}

func contains(list []string, user string) bool {
	for _, u := range list {
		if u == user {
			return true
		}
	}
	return false
}

func UpdateUserPrivacy(userId int, isPrivate bool) error {
	query := "UPDATE users SET is_private = ? WHERE id = ?"
	_, err := DB.Exec(query, isPrivate, userId)
	if err != nil {
		return err
	}
	return nil
}

func CheckPublic(id int) (bool, error) {
	var result bool
	query := "SELECT is_private FROM users WHERE id = ?"

	row := DB.QueryRow(query, id)

	err := row.Scan(&result)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return result, nil
}

func BeforInsertion(follower_id int, following_id int) bool {
	var exist bool
	query := "SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)"

	DB.QueryRow(query, follower_id, following_id).Scan(&exist)

	return exist
}

// SearchUsersByName searches users by first name or last name
func SearchUsersByName(searchTerm string) ([]utils.UserProfile, error) {
	query := `SELECT id, first_name, last_name, nikname, avatar, is_private 
	          FROM users 
	          WHERE first_name LIKE ? OR last_name LIKE ? 
	          ORDER BY first_name ASC, last_name ASC;`

	searchPattern := "%" + searchTerm + "%"
	rows, err := DB.Query(query, searchPattern, searchPattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []utils.UserProfile
	for rows.Next() {
		var user utils.UserProfile
		var nickname sql.NullString
		var avatar sql.NullString
		if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &nickname, &avatar, &user.IsPrivate); err != nil {
			return nil, err
		}

		if nickname.Valid {
			user.Nickname = nickname.String
		} else {
			user.Nickname = ""
		}

		// Handle null avatar
		if avatar.Valid {
			user.Avatar = avatar.String
		} else {
			user.Avatar = ""
		}

		users = append(users, user)
	}
	return users, nil
}

// GetAllUsersWithAvatars returns all users with their basic info including avatars
func GetAllUsersWithAvatars() ([]utils.UserProfile, error) {
	/*
		if withFollowers {

		}
	*/
	rows, err := DB.Query("SELECT id, first_name, last_name, nikname, avatar, is_private FROM users ORDER BY nikname ASC;")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []utils.UserProfile
	for rows.Next() {
		var user utils.UserProfile
		var nickname sql.NullString
		var avatar sql.NullString
		if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &nickname, &avatar, &user.IsPrivate); err != nil {
			return nil, err
		}

		// Handle null nickname
		if nickname.Valid {
			user.Nickname = nickname.String
		} else {
			user.Nickname = ""
		}

		// Handle null avatar
		if avatar.Valid {
			user.Avatar = avatar.String
		} else {
			user.Avatar = ""
		}

		users = append(users, user)
	}
	return users, nil
}

func CheckPendingRequest(followerID, followingID int) bool {
	var count int
	query := "SELECT COUNT(*) FROM followers WHERE follower_id = ? AND following_id = ? AND status = 'pending'"
	err := DB.QueryRow(query, followerID, followingID).Scan(&count)
	if err != nil {
		fmt.Println("Error checking pending request:", err)
		return false
	}
	return count > 0
}

func GetfollowerList(userID int) (*utils.FollowResult, error) {
	var users []utils.FollowUser

	query := `
		SELECT u.id, u.first_name, u.last_name, u.nikname, u.avatar 
		FROM users u 
		INNER JOIN followers f ON u.id = f.follower_id 
		WHERE f.following_id = ? AND f.status = 'accepted'
		ORDER BY u.first_name
	`
	rows, err := DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var user utils.FollowUser
		err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return &utils.FollowResult{
		Users: users,
		Count: len(users),
	}, nil
}

func GetFollowinglist(userID int) (*utils.FollowResult, error) {
	var users []utils.FollowUser

	query := `
		SELECT u.id, u.first_name, u.last_name, u.nikname, u.avatar 
		FROM users u 
		INNER JOIN followers f ON u.id = f.following_id 
		WHERE f.follower_id = ? AND f.status = 'accepted'
		ORDER BY u.first_name
	`

	rows, err := DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user utils.FollowUser
		err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return &utils.FollowResult{
		Users: users,
		Count: len(users),
	}, nil
}

// UserExists checks if a user exists by ID
func UserExists(userID int) bool {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)"
	DB.QueryRow(query, userID).Scan(&exists)
	return exists
}

// CanViewProfile checks if a user can view another user's profile posts
func CanViewProfile(viewerID, targetUserID int) bool {
	// User can always view their own profile
	if viewerID == targetUserID {
		return true
	}

	// Check if target user is private
	isPrivate, err := CheckPublic(targetUserID)
	if err != nil {
		return false
	}

	// If target user is not private, anyone can view
	if !isPrivate {
		return true
	}

	// If target user is private, check if viewer is following them
	return IsFollowing(viewerID, targetUserID)
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
