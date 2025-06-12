package db

import (
	"database/sql"
	"fmt"

	"social-network/utils"
	"social-network/Database/sqlite"
)

var DB = sqlite.GetDB()
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
		// fmt.Println(err)
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

func GetUserInfo(id int) (string, string) {
	var name, avatar string
	quire := "SELECT nikname, avatar FROM users WHERE id = ?"
	err := DB.QueryRow(quire, id).Scan(&name, &avatar)
	if err != nil {
		fmt.Println("Error getting user info:", err)
		return "", ""
	}
	fmt.Printf("User ID %d: name='%s', avatar='%s'\n", id, name, avatar)
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

func GetPostsByUserId(userId int) ([]utils.Postes, error) {
	var postes []utils.Postes
	quire := "SELECT id, user_id, title, content, created_at FROM postes WHERE user_id = ? ORDER BY created_at DESC"
	rows, err := DB.Query(quire, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var post utils.Postes
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt)
		if err != nil {
			return nil, err
		}
		post.Nembre, err = LenghtComent(post.ID)
		post.Username = GetUser(post.UserID)
		if post.Username == "" {
			return nil, err
		}

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
	quire := "SELECT id, post_id, user_id, comment, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC"
	rows, err := DB.Query(quire, postid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var comment utils.CommentPost
		err := rows.Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.CreatedAt)
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
