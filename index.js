require('dotenv').config()

const { ApolloServer } = require('apollo-server')
const { PubSub } = require('apollo-server')
const sqlite3 = require('sqlite3').verbose()
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')
const users = require('./users')

const pubsub = new PubSub()
const db = new sqlite3.Database('./messages.db', (err) => {
    if (err) {
        return console.error(err.message)
    }
    console.log('connected to database')
})

db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        users TEXT,
        content TEXT 
    )
`)

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async (ctx) => ({ ... ctx, pubsub, db }),
    subscriptions: {
        path: '/ws',
        onConnect: (connectionParams) => {
            let user = JSON.parse(connectionParams.user)
            if (user) {
                users.join({ pubsub }, user)
                return { user }
            }
            return {}
        },
        onDisconnect: async (_, { initPromise }) => {
            const initialContext = await initPromise
            let user = initialContext.user
            if (user) {
                users.left({ pubsub }, user)
            }
        },
    },
})

server.listen(process.env.PORT || 4000).then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`)
    console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})