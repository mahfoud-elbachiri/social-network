	CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sender TEXT,
			receiver TEXT,
			text TEXT,
			time TEXT
		);