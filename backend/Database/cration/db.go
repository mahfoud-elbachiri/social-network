package db

import (
	_ "github.com/mattn/go-sqlite3"
)

/*
var DB *sql.DB

func Db() (*sql.DB, error) {
	var err error
	DB, err = sql.Open("sqlite3", "../Database/cration/tet.db")
	if err != nil {
		return nil, err
	}
	err = CreateTable()
	if err != nil {
		return nil, err
	}

	return DB, nil
}

*/
