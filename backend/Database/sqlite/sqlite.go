package sqlite

import (
	"database/sql"
	"fmt"
	"log"
	"sync"

	"github.com/golang-migrate/migrate/v4"
	sqlite3 "github.com/golang-migrate/migrate/v4/database/sqlite"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "modernc.org/sqlite"
)

var (
	db   *sql.DB
	once sync.Once // hada kandiro wsto chi function ila bghinaha tkhdem ghi mera whda wkha ncalliwha bzf
)

func GetDB() *sql.DB {
	once.Do(func() {
		var err error

		var databasePath string
		var migrationsPath string

		databasePath = "./Database/social-network.db"
		migrationsPath = "file://./Database/migrations/sqlite"

		fmt.Printf("Using database path: %s\n", databasePath)
		fmt.Printf("Using migrations path: %s\n", migrationsPath)

		db, err = sql.Open("sqlite", databasePath)
		if err != nil {
			log.Fatalln("Error opening DB:", err)
		}

		db.Exec("PRAGMA foreign_keys = OFF")

		if err := runMigrations(db, migrationsPath); err != nil {
			log.Fatalln("Migration error:", err)
		}
		fmt.Println("✅ DB initialized succes")
	})

	return db
}

func runMigrations(db *sql.DB, migrationsPath string) error {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(
		migrationsPath,
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
