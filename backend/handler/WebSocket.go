package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	db "social-network/Database/cration"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	clients            = make(map[*websocket.Conn]string)
	clientsMutex       sync.RWMutex
	broadcast          = make(chan Message)
	// broadcastGroupChat = make(chan db.GroupChatMessage)
)

type Message struct {
	Sender   string `json:"sender"`
	Receiver string `json:"receiver"`
	Content  string `json:"content"`
	Type     string `json:"type"`
	GroupId  int    `json:"group_id"`
	User_ID  string
	Time     string
	Grp      bool
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WebSocket upgrade error:", err)
		return
	}

	cookie, err := r.Cookie("SessionToken")
	if err != nil || cookie.Value == "" {
		fmt.Println("Error sessionToken ", err)
		return
	}

	username := db.GetUsernameByToken(cookie.Value)
	if username == "" {
		fmt.Println("Invalid username: ", username)
		return
	}

	defer func() {
		clientsMutex.Lock()
		delete(clients, conn)
		clientsMutex.Unlock()

		BroadcastUsers()
		conn.Close()
	}()

	clientsMutex.Lock()
	// Close existing connection for same user
	for existingConn, existingUsername := range clients {
		if existingUsername == username {
			fmt.Println("Closing previous connection for username:", username)
			existingConn.Close()
			delete(clients, existingConn)
			break
		}
	}
	clients[conn] = username
	clientsMutex.Unlock()

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("WebSocket read error:", err)
			break
		}

		if msg.Content == "broadcast" {
			fmt.Println("Broadcasting users")
			BroadcastUsers()
		} else if msg.Type == "groupChat" {
			// Handle group chat message
			
			timestamp := time.Now().Format("2006-01-02 15:04:05")
			// groupID, _ := strconv.Atoi(msg.GroupId)
			groupID := msg.GroupId
			userID := db.GetId("SessionToken", cookie.Value)

			// Check if user is member of the group
			isMember, err := db.IsUserGroupMember(userID, groupID)
			if err != nil || !isMember {
				fmt.Println("User not authorized for group chat:", userID, groupID)
				continue
			}

			// Insert message into database
			err = db.InsertGroupChatMessage(groupID, userID, msg.Content, timestamp)
			if err != nil {
				fmt.Println("Failed to insert group chat message:", err)
				continue
			}

			// Create group chat message for broadcast
			groupChatMsg := db.GroupChatMessage{
				GroupID:   groupID,
				UserID:    userID,
				Username:  username,
				Message:   msg.Content,
				Timestamp: timestamp,
				Type:      "chat_message",
			}

			// Broadcast to group members
			BroadcastGroupChatMessage(groupChatMsg)

		} else {
			// Handle private messages
			timestamp := time.Now().Format("2006-01-02 15:04:05")
			msg.Time = timestamp

			err = db.InsertMessages(msg.Sender, msg.Receiver, msg.Content, msg.Time)
			if err != nil {
				fmt.Println("insert messages error:", err)
				return
			}
			broadcast <- msg
		}
	}
}

// BroadcastGroupChatMessage sends a chat message to all WebSocket clients in the same group
func BroadcastGroupChatMessage(message db.GroupChatMessage) {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()

	for client, username := range clients {
		// Get user ID for this client
		userID := db.GetId("nikname", username)
		if userID == 0 {
			continue
		}

		// Check if this user is a member of the group
		isMember, err := db.IsUserGroupMember(userID, message.GroupID)
		if err != nil || !isMember {
			continue
		}

		// Send message to this client
		err = client.WriteJSON(message)
		if err != nil {
			fmt.Println("WebSocket write error:", err)
			client.Close()
			clientsMutex.Lock()
			delete(clients, client)
			clientsMutex.Unlock()
		}
	}
}



func HandleMessages() {
	for {
		msg := <-broadcast

		clientsMutex.RLock()
		for client, username := range clients {
			if username == msg.Receiver || username == msg.Sender {
				err := client.WriteJSON(msg)
				if err != nil {
					fmt.Println("WebSocket write error:", err)
					client.Close()
					clientsMutex.Lock()
					delete(clients, client)
					clientsMutex.Unlock()
				}
			}
		}
		BroadcastUsers()
		clientsMutex.RUnlock()
	}
}

type UserFollowers struct {
	Username string
	Alluser  []string
}

func sortU(allUser []string) ([]UserFollowers, error) {
	var Users []UserFollowers

	for _, user := range allUser {
		id := db.GetId("nikname", user)

		allUsers, err := db.GetFollowersUsers(id)
		if err != nil {
			return nil, err
		}

		Users = append(Users, UserFollowers{
			Username: user,
			Alluser:  allUsers,
		})
	}

	return Users, nil
}

func BroadcastUsers() {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()

	allUsers, err := db.GetAllUsers()
	if err != nil {
		fmt.Println("Error fetching all users:", err)
		return
	}

	sortUser, err := sortU(allUsers)
	if err != nil {
		fmt.Println("Error fetching sort users:", err)
		return
	}

	users := []map[string]any{}
	for _, user := range sortUser {

		sort := []map[string]any{}

		for _, us := range user.Alluser {
			online := false

			avatar := db.GetAvatar(us)

			for _, onlineUser := range clients {
				if onlineUser == us {
					online = true
					break
				}
			}

			sort = append(sort, map[string]any{
				"user":   us,
				"online": online,
				"avatar": avatar,
			})
		}

		users = append(users, map[string]any{
			"username": user.Username,
			"sort":     sort,
		})
	}

	message := map[string]any{
		"type":  "users",
		"users": users,
	}

	for client := range clients {
		err := client.WriteJSON(message)
		if err != nil {
			fmt.Println("WebSocket write error:", err)
			client.Close()
			clientsMutex.Lock()
			delete(clients, client)
			clientsMutex.Unlock()
		}
	}
}
