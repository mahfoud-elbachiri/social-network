package db

import (
	"fmt"
	"strconv"
	"time"
)

func Insertuser(first_name string, last_name string, email string, gender string, age string, nikname string, password string) error {
	infiuser, err := DB.Prepare("INSERT INTO users (first_name, last_name, email, gender, age, nikname, password) VALUES (?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	age_int, err := strconv.Atoi(age)
	if err != nil {
		return err
	}
	_, err = infiuser.Exec(first_name, last_name, email, gender, age_int, nikname, password)
	if err != nil {
		return err
	}
	return nil
}

func InsertPostes(user_id int, title string, content string) error {
	created_at := time.Now().Format("2006-01-02 15:04:05")

	info, err := DB.Prepare("INSERT INTO postes (user_id,title,content,created_at) VALUES (?,?,?,?)")
	if err != nil {
		fmt.Println("==> E : ", err)
		return err
	}
	_, err = info.Exec(user_id, title, content, created_at)
	if err != nil {
		return err
	}

	return nil
}

func InsertReaction(user_id int, content_id int, content_type string, reaction_type string) error {
	if content_type == "post" {
		err := SelectPostid(content_id)
		if err != nil {
			return err
		}
	} else if content_type == "comment" {
		err := SelectCommentid(content_id)
		if err != nil {
			return err
		}
	}

	info, err := DB.Prepare("INSERT INTO reactions (user_id,content_type,content_id,reaction_type) VALUES (?,?,?,?)")
	if err != nil {
		return err
	}
	_, err = info.Exec(user_id, content_type, content_id, reaction_type)
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

func DeleteReaction(user_id int, content_id int) error {
	info, err := DB.Prepare("DELETE FROM reactions WHERE user_id = ? AND content_id = ?")
	if err != nil {
		return err
	}
	_, err = info.Exec(user_id, content_id)
	if err != nil {
		return err
	}
	return nil
}

func Update(userid int, postid int, reactiontype string) error {
	info, err := DB.Prepare("UPDATE reactions SET reaction_type = ? WHERE user_id = ? AND content_id = ?")
	if err != nil {
		return err
	}
	_, err = info.Exec(reactiontype, userid, postid)
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
