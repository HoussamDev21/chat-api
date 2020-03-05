const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        return console.error(err.message)
    }
    console.log('connected to database')
})

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        status INTEGER DEFAULT 0,
        status_time TIMESTAMP,
        created_at TIMESTAMP default CURRENT_TIMESTAMP
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS user_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT,
        user_id INTEGER,
        created_at TIMESTAMP default CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        user_id TEXT,
        created_at TIMESTAMP default CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TIMESTAMP default CURRENT_TIMESTAMP
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS participations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEREGR,
        conversation_id INTEREGR,
        created_at TIMESTAMP default CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON UPDATE CASCADE,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON UPDATE CASCADE
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS message_participation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEREGR,
        participation_id INTEREGR,
        created_at TIMESTAMP default CURRENT_TIMESTAMP,
        FOREIGN KEY(message_id) REFERENCES messages(id) ON UPDATE CASCADE,
        FOREIGN KEY(participation_id) REFERENCES participations(id) ON UPDATE CASCADE
    )
`)