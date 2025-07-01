package main

import (
	"database/sql"
	"fmt"
	"net/http"

	data "social-network/Database/sqlite"
	"social-network/handler"
	"social-network/utils"
)
// gha bach manb9ach n3dl kol mra compt
func addUsers(db *sql.DB) error {
	users := []struct {
		FirstName string
		LastName  string
		Email     string
		Gender    string
		Age       int
		Nickname  string
		Password  string
		AboutMe   string
		Avatar    string
		IsPrivate bool
	}{
		{"User", "One", "user1@example.com", "male", 25, "user1", "user1", "", "", false},
		{"User", "Two", "user2@example.com", "male", 25, "user2", "user2", "", "", false},
		{"User", "Three", "user3@example.com", "male", 25, "user3", "user3", "", "", false},
	}

	for _, u := range users {
		// Hash password
		hashedPass, err := utils.HashPassword(u.Password)
		if err != nil {
			return fmt.Errorf("failed to hash password for %s: %w", u.Nickname, err)
		}

		// Insert user with raw SQL query
		_, err = db.Exec(`
			INSERT INTO users (
				first_name, last_name, email, gender, age, nikname, password, avatar, about_me, is_private
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			u.FirstName, u.LastName, u.Email, u.Gender, u.Age, u.Nickname, hashedPass, u.Avatar, u.AboutMe, u.IsPrivate,
		)
		if err != nil {
			return fmt.Errorf("failed to insert user %s: %w", u.Nickname, err)
		}
	}

	return nil
}

func main() {
	Db := data.GetDB()

	defer Db.Close()
	addUsers(Db)
	router := http.NewServeMux()

	router.HandleFunc("/resgester", handler.Register)
	router.HandleFunc("/login", handler.Login)

	router.Handle("/statuts", handler.AuthMiddleware(http.HandlerFunc(handler.Statuts)))
	router.Handle("/profile", handler.AuthMiddleware(http.HandlerFunc(handler.Profile)))
	router.Handle("/pubpost", handler.AuthMiddleware(http.HandlerFunc(handler.Post)))
	router.Handle("/getpost", handler.AuthMiddleware(http.HandlerFunc(handler.Getpost)))
	router.Handle("/getpostsofuser", handler.AuthMiddleware(http.HandlerFunc(handler.GetPostsOfUser)))
	router.Handle("/getChats", handler.AuthMiddleware(http.HandlerFunc(handler.Getchats)))
	router.Handle("/sendcomment", handler.AuthMiddleware(http.HandlerFunc(handler.Sendcomment)))
	router.Handle("/getcomment", handler.AuthMiddleware(http.HandlerFunc(handler.Comments)))
	router.Handle("/logout", handler.AuthMiddleware(http.HandlerFunc(handler.Logout)))
	router.Handle("/getusers", handler.AuthMiddleware(http.HandlerFunc(handler.GetUsers)))
	// Group system
	router.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("../frontend/public/uploads"))))

	router.Handle("/groupPage", handler.AuthMiddleware(http.HandlerFunc(handler.HomepageGroup)))
	router.Handle("/group", handler.AuthMiddleware(http.HandlerFunc(handler.GroupPageHandler)))
	router.Handle("/create-group", handler.AuthMiddleware(http.HandlerFunc(handler.CreateGroupHandler)))
	router.Handle("/join-group", handler.AuthMiddleware(http.HandlerFunc(handler.JoinGroupHandler)))
	router.Handle("/group/accept", handler.AuthMiddleware(http.HandlerFunc(handler.AcceptJoinRequestHandler)))
	router.Handle("/group/reject", handler.AuthMiddleware(http.HandlerFunc(handler.RejectJoinRequestHandler)))
	router.Handle("/group/invite", handler.AuthMiddleware(http.HandlerFunc(handler.GroupInviteHandler)))
	router.Handle("/group/accept-invite", handler.AuthMiddleware(http.HandlerFunc(handler.AcceptInviteHandler)))
	router.Handle("/group/reject-invite", handler.AuthMiddleware(http.HandlerFunc(handler.RejectInviteHandler)))
	router.Handle("/group/create-event", handler.AuthMiddleware(http.HandlerFunc(handler.CreateEventHandler)))
	router.Handle("/group/event-respond", handler.AuthMiddleware(http.HandlerFunc(handler.EventResponseHandler)))
	router.Handle("/group/create-post", handler.AuthMiddleware(http.HandlerFunc(handler.CreateGroupPostHandler)))
	router.Handle("/group/create-comment", handler.AuthMiddleware(http.HandlerFunc(handler.CreateGroupCommentHandler)))

	// follow sytyem
	router.Handle("/followRequest", handler.AuthMiddleware(http.HandlerFunc(handler.Followreq)))
	router.Handle("/unfollowRequest", handler.AuthMiddleware(http.HandlerFunc(handler.Unfollowreq)))
	router.Handle("/isFollowing", handler.AuthMiddleware(http.HandlerFunc(handler.CheckFollow)))
	router.Handle("/follow-data", handler.AuthMiddleware(http.HandlerFunc(handler.GetFollowDataHandler)))

	// Notification
	router.Handle("/notifications", handler.AuthMiddleware(http.HandlerFunc(handler.GetNotifications)))
	router.Handle("/accept-follow-request", handler.AuthMiddleware(http.HandlerFunc(handler.AcceptFollowRequest)))
	router.Handle("/reject-follow-request", handler.AuthMiddleware(http.HandlerFunc(handler.RejectFollowRequest)))

	router.Handle("/accept-group-invitation", handler.AuthMiddleware(http.HandlerFunc(handler.AcceptGroupInvitation)))
	router.Handle("/reject-group-invitation", handler.AuthMiddleware(http.HandlerFunc(handler.RejectGroupInvitation)))

	router.Handle("/accept-group-join-request", handler.AuthMiddleware(http.HandlerFunc(handler.AcceptGroupJoinRequest)))
	router.Handle("/reject-group-join-request", handler.AuthMiddleware(http.HandlerFunc(handler.RejectGroupJoinRequest)))

	// router.HandleFunc("/online-users", handler.OnlineUsers)
	router.HandleFunc("/ws", handler.WebSocketHandler) // Add WebSocket route
	go handler.HandleMessages()                        // Start WebSocket message handler in a goroutine
	go handler.HandleGroupMessages()

	// Wrap router with CORS middleware
	corsRouter := handler.CorsMiddleware(router)

	fmt.Println("✅ Server running on: http://localhost:8080")
	err := http.ListenAndServe(":8080", corsRouter)
	if err != nil {
		fmt.Println(err)
		return
	}
}
