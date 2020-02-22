const { withFilter } = require('apollo-server')
const users = require('./users')

module.exports = {
	Query: {
		onlineUsers(_, __, { req }) {
			let user = JSON.parse(req.headers.user)
			return users.list.filter(u => u.username !== user.username)
		},
		async messages(_, { username }, { req, db }) {
			let user = JSON.parse(req.headers.user)
			let rows = await new Promise((res, rej) => db.all(
				'SELECT * FROM messages WHERE users = ? OR users = ?', 
				[`${username}|${user.username}`,`${user.username}|${username}`], 
				(err, rows) => {
					if (err) rej(err)
					else res(rows)
				}
			))
			let messages = rows.map(item => {
				return {
					content: item.content,
					sender: { username: item.users.split('|')[0] },
					receiver: { username: item.users.split('|')[1] },
				}
			})
			return messages
		},
	},
    Mutation: {
		sendMessage(_, { content, receiver }, { req, pubsub, db }) {
			let user = JSON.parse(req.headers.user)
			let message = { content, sender: user, receiver: { username: receiver }}
			db.run('INSERT INTO messages (content,users) VALUES (?,?)', [content, `${user.username}|${receiver}`])
			pubsub.publish('NEW_MESSAGE', { newMessage: message })
			return message
		}
	},
	Subscription: {
		onlineUsers: {
		  	subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('ONLINE_USERS')
		},
		newMessage: {
			subscribe: withFilter(
				(_, __, { pubsub }) => pubsub.asyncIterator('NEW_MESSAGE'),
				({ newMessage }, { participants }) => {
					let condition = participants.includes(newMessage.sender.username)
					&& participants.includes(newMessage.receiver.username)
					return condition
				},
			)
		},
	}
}