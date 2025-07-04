package main

import (
	"fmt"
	"net/http"
	"path/filepath"

	data "social-network/Database/sqlite"
	db "social-network/Database/cration"
	"social-network/handler"
	"social-network/utils"
)

func main() {
	Db := data.GetDB()
	defer Db.Close()

	// Create group chat table if it doesn't exist
	err := db.CreateGroupChatTable()
	if err != nil {
		fmt.Printf("Error creating group chat table: %v\n", err)
	}
	router := http.NewServeMux()

	// serve image folder (docker)
	imageBasePath := utils.GetImageBasePath()
	router.Handle("/avatars/", http.StripPrefix("/avatars/", http.FileServer(http.Dir(filepath.Join(imageBasePath, "avatars")))))
	router.Handle("/avatars2/", http.StripPrefix("/avatars2/", http.FileServer(http.Dir(filepath.Join(imageBasePath, "avatars2")))))

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
	router.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(filepath.Join(imageBasePath, "uploads")))))

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

	// Group Chat endpoints - NEW
	router.HandleFunc("/group/chat", func(w http.ResponseWriter, r *http.Request) {
		handler.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				handler.GetGroupChatHandler(w, r)
			case http.MethodPost:
				handler.SendGroupChatHandler(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		})).ServeHTTP(w, r)
	})

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

	// WebSocket
	router.HandleFunc("/ws", handler.WebSocketHandler) // Add WebSocket route
	go handler.HandleMessages()                        // Start WebSocket message handler in a goroutine
	go handler.HandleGroupMessages()

	// Wrap router with CORS middleware
	corsRouter := handler.CorsMiddleware(router)

	fmt.Println("✅ Server running on: http://localhost:8080")
	err = http.ListenAndServe(":8080", corsRouter)
	if err != nil {
		fmt.Println(err)
	}
}
