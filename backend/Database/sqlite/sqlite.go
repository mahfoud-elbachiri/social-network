package sqlite

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	sqlite3 "github.com/golang-migrate/migrate/v4/database/sqlite"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
	"sync"
)

var (
	db   *sql.DB
	once sync.Once // hada kandiro wsto chi function ila bghinaha tkhdem ghi mera whda wkha ncalliwha bzf
)

func GetDB() *sql.DB {
	once.Do(func ()  { 
	var err error
	databasePath := "../Database/social-network.db"
	db, err = sql.Open("sqlite3", databasePath)
	if err != nil {
		log.Fatalln("Error opening DB:", err)
	}

	db.Exec("PRAGMA foreign_keys = ON")

	if err := runMigrations(db); err != nil {
		log.Fatalln("Migration error:", err)
	}
	fmt.Println("✅ DB initialized succes")
		
	})


	return db
}

func runMigrations(db *sql.DB) error {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://../Database/migrations/sqlite",
		"sqlite3",
		driver,
	)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}

	return nil
}
