module.exports = {
    async userConversations({ user, db }) {
        let rows = await new Promise((resolve, reject) => db.all(
            `SELECT * FROM (SELECT 
                conversation_id AS id,
                conversations.created_at,
                MAX(message_participation.created_at) AS message_created_at,
                message_participation.message_id,
                messages.content AS message_content,
                messages.user_id AS message_user_id
            FROM participations 
            JOIN conversations 
                ON participations.conversation_id = conversations.id
            JOIN message_participation
                ON message_participation.participation_id = participations.id
            JOIN messages
                ON messages.id = message_id
            WHERE participations.user_id = ?)
            WHERE id NOTNULL`, 
            [user.id],
            (error, rows) => {
                if (error) reject(error)
                resolve(rows)
            }
        ))
        let conversations_ids = rows.map(c => c.id)
        let participants = await new Promise((resolve, reject) => db.all(
            `SELECT 
                users.id,
                users.username,
                participations.conversation_id 
            FROM participations 
            JOIN users ON participations.user_id = users.id 
            WHERE participations.conversation_id IN (${conversations_ids.join(',')})`, 
            [],
            (error, rows) => {
                if (error) reject(error)
                resolve(rows)
            }
        ))
        let conversations = rows.map(c => ({
            id: c.id,
            created_at: c.created_at,
            participants: participants.filter((p) => p.conversation_id === c.id)
                .map((p) => ({
                    id: p.id,
                    username: p.username
                })),
            lastMessage: {
                id: c.message_id,
                content: c.message_content,
                created_at: c.message_created_at,
                user_id: c.message_user_id,
            }
        }))
        console.log(rows)
        return conversations
    },
    async startConversationWithUser({ user_id, user, db }) {
        let row = await new Promise((resolve, reject) => db.get(
            'SELECT COUNT(*) AS count, conversation_id FROM participations WHERE conversation_id IN (SELECT conversation_id FROM participations WHERE user_id = ?) AND user_id = ?', [user.id, user_id],
            (error, row) => {
                if (error) reject(error)
                resolve(row)
            }
        ))
        let conversation_id
        if (row.count === 1) {
            conversation_id = row.conversation_id
        } else {
            conversation_id = await new Promise((resolve) => db.run('INSERT INTO conversations DEFAULT VALUES', [], function () { resolve(this.lastID) }))
            await new Promise((resolve) => db.run('INSERT INTO participations (user_id, conversation_id) VALUES (?, ?)', [user_id, conversation_id], function () { resolve(this.lastID) }))
            await new Promise((resolve) => db.run('INSERT INTO participations (user_id, conversation_id) VALUES (?, ?)', [user.id, conversation_id], function () { resolve(this.lastID) }))
        }
        let conversation = await new Promise((resolve, reject) => db.get(
            'SELECT * FROM conversations WHERE id = ?', [conversation_id],
            (error, row) => {
                if (error) reject(error)
                resolve(row)
            }
        ))
        let participants = await new Promise((resolve, reject) => db.all(
            'SELECT users.id, username FROM participations JOIN users ON participations.user_id = users.id WHERE conversation_id = ?', [conversation_id],
            (error, row) => {
                if (error) reject(error)
                resolve(row)
            }
        ))
        conversation.participants = participants
        return conversation
    }
}