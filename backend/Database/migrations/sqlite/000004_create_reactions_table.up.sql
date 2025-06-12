	CREATE TABLE IF NOT EXISTS reactions (
   		 id INTEGER PRIMARY KEY AUTOINCREMENT,
    	 user_id INTEGER NOT NULL,
    	 content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
     	 content_id INTEGER NOT NULL, 
    	 reaction_type TEXT NOT NULL ,
    	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE	
		);