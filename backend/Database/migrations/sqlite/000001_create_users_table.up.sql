	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		gender TEXT NOT NULL,
		age INTEGER NOT NULL,
		nikname TEXT UNIQUE,
		`password` TEXT NOT NULL,
		sessionToken TEXT,
		avatar TEXT,         
		about_me TEXT,
		is_private BOOLEAN DEFAULT FALSE  -- TRUE = private, FALSE = public
	);