package main

import (
	"fmt"
	"log"

	data "social-network/Database/sqlite"
	db "social-network/app/cration"
	"social-network/server"
)

func main() {
	Db := data.GetDB()
	defer Db.Close()

	// Create group chat table if it doesn't exist
	err := db.CreateGroupChatTable()
	if err != nil {
		fmt.Printf("Error creating group chat table: %v\n", err)
	}

	//start server
	if err := server.SetupRoutes(); err != nil {
		log.Fatal(err)
	}

}
