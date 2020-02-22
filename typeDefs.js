const { gql } = require('apollo-server')

module.exports = gql`
    type User {
        username: String
    }
    type Message {
        content: String,
        sender: User,
        receiver: User,
    }
    type Query {
        onlineUsers: [User]
        messages(username: String!): [Message]
    }
    type Mutation {
        sendMessage(content: String!, receiver: String!): Message
    }
    type Subscription {
        onlineUsers: [User]
        newMessage(participants: [String]!): Message
    }
    schema {
        query: Query
        subscription: Subscription
        mutation: Mutation
    }
`

