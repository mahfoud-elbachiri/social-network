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
