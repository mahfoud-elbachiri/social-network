package db

import (
	"fmt"
	"strconv"
	"time"
)

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

func InsertComment(post_id int, user_id int, comment string) error {
	created_at := time.Now().Format("2006-01-02 15:04:05")
	info, err := DB.Prepare("INSERT INTO comments (post_id , user_id , comment , created_at) VALUES (?,?,?,?)")
	if err != nil {
		return err
	}
	_, err = info.Exec(post_id, user_id, comment, created_at)
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
