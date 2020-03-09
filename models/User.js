require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

module.exports = {
    async authentication({ input, db }) {
        if (!input.username || !input.password) return {
            ok: false,
            error: 'invalid data'
        }
        let user = await new Promise((resolve, reject) => db.get(
            'SELECT * FROM users WHERE username = ?', [input.username],
            (error, row) => {
                if (error) reject(error)
                else resolve(row)
            }
        ))
        let user_id
        if (user) {
            user_id = user.id
            let isValidPassword = bcrypt.compareSync(input.password, user.password)
            if (!isValidPassword) return {
                ok: false,
                error: 'invalid password'
            }
        } else {
            const salt = bcrypt.genSaltSync(10)
            let password = bcrypt.hashSync(input.password, salt)
            user_id = await new Promise((resolve) => db.run('INSERT INTO users (username, password) VALUES (?, ?)', [input.username, password], function () {
                resolve(this.lastID)
            }))
        }
        let token = jwt.sign({ username: input.username, key: Date.now() }, JWT_SECRET)
        db.run('INSERT INTO user_tokens (user_id, token) VALUES (?, ?)', [user_id, token])
        return {
            ok: true,
            token
        }
    },
    async logout({ db, token }) {
        await this.updateUserStatus({ token, db, value: -1 })
        await new Promise((resolve, reject) => db.run('DELETE FROM user_tokens WHERE token = ?', [token], function (error) {
            if (error) reject(error)
            resolve(true)
        }))
    },
    async getUserByToken({ token, db }) {
        let user = await new Promise((resolve, reject) => db.get(
            `SELECT 
                users.id,
                users.username,
                users.status,
                users.status_time
            FROM user_tokens as tokens 
            INNER JOIN users 
            ON tokens.user_id = users.id WHERE token = ?`, 
            [token],
            (error, row) => {
                if (error) reject(error)
                else resolve(row)
            }
        ))
        return user
    },
    async updateUserStatus({ token, db, value }) {
        let user = await this.getUserByToken({ token, db })
        if (user) {
            user.status = user.status + value
            await new Promise((resolve, reject) => db.run(
                `UPDATE users SET status = $status, status_time = CURRENT_TIMESTAMP WHERE id = $id`,
                {
                    $status: user.status,
                    $id: user.id
                },
                (error) => {
                    if (error) reject(error)
                    resolve(true)
                }
            ))
            return user
        }
    },
    onlineUsers({ db }) {
        return new Promise((resolve, reject) => db.all(
            `SELECT * FROM users WHERE status > 0`, [],
            (error, rows) => {
                if (error) reject(error)
                resolve(rows.map((u) => ({
                    id: u.id,
                    username: u.username,
                    status: u.status,
                    status_time: u.status_time
                })))
            }
        ))
    }
}