require('dotenv').config()

const { ApolloServer } = require('apollo-server')
const { PubSub } = require('apollo-server')
const sqlite3 = require('sqlite3').verbose()
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')
const User = require('./models/User')

const pubsub = new PubSub()
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        return console.error(err.message)
    }
    console.log('connected to database')
})

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async (ctx) => {
        if (ctx.req) {
            let token = ctx.req.headers.token
            let user = await User.getUserByToken({ token, db })
            return { ... ctx, pubsub, db, user }
        } else if (ctx.connection) {
            return { ... ctx, pubsub, db, user: ctx.connection.context.user }
        }
    },
    subscriptions: {
        path: '/ws',
        onConnect: async (connectionParams) => {
            let token = connectionParams.token
            if (token) {
                User.updateUserStatus({ token, db, value: 1 })
                return { token }
            }
            return {}
        },
        onDisconnect: async (_, { initPromise }) => {
            const initialContext = await initPromise
            let token = initialContext.token
            if (token) {
                User.updateUserStatus({ token, db, value: -1 })
            }
        },
    },
})

server.listen(process.env.PORT || 4000).then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`)
    console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})