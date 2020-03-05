module.exports = {
    async messages({ conversation_id, user, db }) {
        let sql = `
            SELECT 
                messages.*, 
                users.username
            FROM (
                SELECT m.* 
                FROM message_participation AS mp 
                JOIN messages AS m 
                ON mp.message_id = m.id 
                WHERE mp.participation_id 
                    = (SELECT id FROM participations WHERE user_id = ? AND conversation_id = ?)
            ) AS messages
            JOIN users
            ON messages.user_id = users.id
            ORDER BY created_at DESC
        `
        let rows = await new Promise((resolve, reject) => db.all(sql, [user.id, conversation_id], (error, rows) => {
            if (error) reject(error)
            resolve(rows)
        }))
        return rows.map(({ id, content, created_at, username, user_id }) => ({
            id, content, created_at,
            user: {
                id: user_id,
                username
            }
        }))
    },
    async createMessage({ content, conversation_id, db, user }) {
        let message_id = await new Promise((resolve) => db.run('INSERT INTO messages (content, user_id) VALUES (?, ?)', [content, user.id], function () { resolve(this.lastID) }))
        let rows = await new Promise((resolve, reject) => db.all(
            'SELECT id FROM participations WHERE conversation_id = ?', [conversation_id],
            (error, rows) => {
                if (error) reject(error)
                else resolve(rows)
            }
        ))
        rows.forEach(({ id: participation_id }) => {
            db.run('INSERT INTO message_participation (message_id, participation_id) VALUES (?, ?)', [message_id, participation_id])
        })
        let message = await new Promise((resolve, reject) => db.get(
            'SELECT * FROM messages WHERE id = ?', [message_id],
            (error, row) => {
                if (error) reject(error)
                else resolve(row)
            }
        ))
        let message_user = await new Promise((resolve, reject) => db.get(
            'SELECT * FROM users WHERE id = ?', [message.user_id],
            (error, row) => {
                if (error) reject(error)
                else resolve(row)
            }
        ))
        return {
            id: message.id,
            content: message.content,
            created_at: message.created_at,
            user: {
                id: message_user.id,
                username: message_user.username
            }
        }
    }
}