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
		// origin := r.Header.Get("Origin")
		return true
	},
}

var (
	clients      = make(map[*websocket.Conn]string)
	clientsMutex sync.RWMutex
	broadcast    = make(chan Message)
	typing       = make(chan Message)
)

type Message struct {
	Sender   string `json:"sender"`
	Receiver string `json:"receiver"`
	Content  string `json:"content"`
	Time     string
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
		fmt.Println("this nigga does'nt exsist : ", username)
		return
	}

	defer func() {
		clientsMutex.Lock()
		delete(clients, conn)
		clientsMutex.Unlock()

		BroadcastUsers()
		// BroadcastOnlineUsers()
		conn.Close()
	}()

	clientsMutex.Lock()
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
	// BroadcastUsers()
	// BroadcastOnlineUsers()

	for {

		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("WebSocket read error:", err)
			break
		}

		if msg.Content == "broadcast" {
			BroadcastUsers()
		}

		if msg.Content == "is-typing" || msg.Content == "no-typing" {
			typing <- msg
		} else if msg.Content != "broadcast"{
			time := time.Now().Format("2006-01-02 15:04:05")
			msg.Time = time
			fmt.Println(msg.Content)
			err = db.InsertMessages(msg.Sender, msg.Receiver, msg.Content, msg.Time)
			if err != nil {
				fmt.Println("insert massages error:", err)
				return
			}
			broadcast <- msg
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

	//fmt.Println("sort users ================++>>>>", users)

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

func BroadcastOnlineUsers() {
	clientsMutex.RLock()
	defer clientsMutex.RUnlock()

	var online []string

	for _, client := range clients {
		online = append(online, client)
	}

	message := map[string]any{
		"type":  "online-users",
		"users": online,
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

func Typing() {
	for {
		msg := <-typing

		clientsMutex.RLock()
		for client, username := range clients {
			if username == msg.Receiver || username == msg.Sender {
				err := client.WriteJSON(msg)
				if err != nil {
					fmt.Println(err)

					client.Close()

					clientsMutex.Lock()
					delete(clients, client)
					clientsMutex.Unlock()
				}
			}
		}
		clientsMutex.RUnlock()
	}
}

// allUsers, err := db.GetAllUsers()
// 	if err != nil {
// 		fmt.Println("Error fetching all users:", err)
// 		return
// 	}

// 	allPublicUsers, err := db.GetAllPublicUsers()
// 	if err != nil {
// 		fmt.Println("Error fetching all users:", err)
// 		return
// 	}

// 	allPrivateUsers, err := db.GetAllPrivateUsers()
// 	if err != nil {
// 		fmt.Println("Error fetching all users:", err)
// 		return
// 	}

// 	res, err :=
// 	if err != nil {
// 		fmt.Println("Error fetching all users:", err)
// 		return
// 	}
