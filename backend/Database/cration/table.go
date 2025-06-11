package db

func CreateTable() error {
	// Code to create a table
	tables := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		gender TEXT NOT NULL,
		age INTEGER NOT NULL,
		nikname TEXT UNIQUE,
		password TEXT NOT NULL,
		sessionToken TEXT,
		avatar TEXT,         
		about_me TEXT,
		is_private BOOLEAN DEFAULT FALSE  -- TRUE = private, FALSE = public
	);
	
	CREATE TABLE IF NOT EXISTS postes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		avatar TEXT,
		privacy TEXT CHECK (privacy IN ('public', 'private', 'almost private')) DEFAULT 'public',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		post_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		comment TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (post_id) REFERENCES postes(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	CREATE TABLE IF NOT EXISTS reactions (
   		 id INTEGER PRIMARY KEY AUTOINCREMENT,
    	 user_id INTEGER NOT NULL,
    	 content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
     	 content_id INTEGER NOT NULL, 
    	 reaction_type TEXT NOT NULL ,
    	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE	
		);
	CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sender TEXT,
			receiver TEXT,
			text TEXT,
			time TEXT
		);
`

	_, err := DB.Exec(tables)
	if err != nil {
		return err
	}
	return nil
}
