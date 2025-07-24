DROP TABLE IF EXISTS chats;
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  username TEXT NOT NULL,
	time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_from_info_chat_id ON chats(message_id);
CREATE INDEX idx_from_info_username ON chats(username);
