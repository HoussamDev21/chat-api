const { withFilter } = require('apollo-server')

const User = require('./models/User')
const Conversation = require('./models/Conversation')
const Message = require('./models/Message')

module.exports = {
	Query: {

		async onlineUsers(_, __, { user, db }) {
			return (await User.onlineUsers({ db })).filter(u => u.id != user.id)
		},

		me(_, __, { user }) {
			if (!user) return null
			return user
		},

		async conversations(_, __, { user, db }) {
			return await Conversation.userConversations({ user, db })
		},

		async messages(_, { conversation_id }, { user, db }) {
			return await Message.messages({ conversation_id, user, db })
		},

		async conversation(_, { user_id }, { db, user }) {
			return await Conversation.startConversationWithUser({ user_id, db, user })
		},

	},
    Mutation: {

		async authentication(_, { input }, { db }) {
			return await User.authentication({ input, db })
		},

		async logout(_, __, { db, req }) {
			await User.logout({ db, token: req.headers.token })
		},

		async sendMessage(_, { content, conversation_id }, { pubsub, db, user }) {
			let newMessage = await Message.createMessage({ content, conversation_id, db, user })
			let conversation = await Conversation.getConversation({ conversation_id, db, user })
			pubsub.publish('NEW_MESSAGE', { newMessage, conversation_id })
			pubsub.publish('CONVERSATION', { conversation })
			return newMessage
		},

	},
	Subscription: {

		userConnected: {
			subscribe: withFilter(
				(_, __, { pubsub }) => pubsub.asyncIterator('USER_CONNECTED'),
				({ userConnected }, __, { user }) => {
					return userConnected.id !== user.id
				}
			)
		},

		userDisconnected: {
			subscribe: withFilter(
				(_, __, { pubsub }) => pubsub.asyncIterator('USER_DISCONNECTED'),
				({ userDisconnected }, __, { user }) => {
					return userDisconnected.id !== user.id
				}
			)
		},

		conversation: {
			subscribe: withFilter(
				(_, __, { pubsub }) => pubsub.asyncIterator('CONVERSATION'),
				({ conversation }, __, { user }) => {
					return conversation.participants.map(p => p.id).includes(user.id)
				}
			)
		},
		
		newMessage: {
			subscribe: withFilter(
				(_, __, { pubsub }) => pubsub.asyncIterator('NEW_MESSAGE'),
				({ conversation_id: c_id_1 }, { conversation_id: c_id_2 }) => {
					return c_id_1 === c_id_2
				},
			)
		},
		
	}
}