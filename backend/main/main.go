package main

import (
	"fmt"
	"net/http"

	data "social-network/Database/sqlite"
	"social-network/handler"
)

func main() {
	Db := data.GetDB()

	defer Db.Close()

	router := http.NewServeMux()

	router.HandleFunc("/resgester", handler.Register)
	router.HandleFunc("/login", handler.Login)

	router.Handle("/statuts", handler.AuthMiddleware(http.HandlerFunc(handler.Statuts)))
	router.Handle("/profile", handler.AuthMiddleware(http.HandlerFunc(handler.Profile)))
	router.Handle("/pubpost", handler.AuthMiddleware(http.HandlerFunc(handler.Post)))
	router.Handle("/getpost", handler.AuthMiddleware(http.HandlerFunc(handler.Getpost)))
	router.Handle("/getChats", handler.AuthMiddleware(http.HandlerFunc(handler.Getchats)))
	router.Handle("/sendcomment", handler.AuthMiddleware(http.HandlerFunc(handler.Sendcomment)))
	router.Handle("/getcomment", handler.AuthMiddleware(http.HandlerFunc(handler.Comments)))
	router.Handle("/logout", handler.AuthMiddleware(http.HandlerFunc(handler.Logout)))
	router.Handle("/getusers", handler.AuthMiddleware(http.HandlerFunc(handler.GetUsers)))
	// Group system
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

	// router.HandleFunc("/online-users", handler.OnlineUsers)
	router.HandleFunc("/ws", handler.WebSocketHandler) // Add WebSocket route
	go handler.HandleMessages()                        // Start WebSocket message handler in a goroutine
	go handler.Typing()

	// Wrap router with CORS middleware
	corsRouter := handler.CorsMiddleware(router)

	fmt.Println("✅ Server running on: http://localhost:8080")
	err := http.ListenAndServe(":8080", corsRouter)
	if err != nil {
		fmt.Println(err)
		return
	}
}
