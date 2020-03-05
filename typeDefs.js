const { gql } = require('apollo-server')

module.exports = gql`

    type User {
        id: ID
        username: String
        status: Int
        status_time: String
    }

    type Message {
        id: ID
        content: String
        created_at: String
        user: User
    }

    type Conversation {
        id: ID
        created_at: String
        participants: [User]
    }

    input AuthenticationInput {
        username: String!
        password: String!
    }

    type AuthenticationResponse {
        ok: Boolean
        error: String
        token: String
    }

    type Query {
        me: User
        onlineUsers: [User]
        conversations: [Conversation]
        messages(conversation_id: ID!): [Message]
        conversation(user_id: ID!): Conversation
    }

    type Mutation {
        authentication(input: AuthenticationInput!): AuthenticationResponse
        logout: Boolean
        sendMessage(content: String!, conversation_id: ID!): Message
    }

    type Subscription {
        onlineUsers: [User]
        newMessage(conversation_id: ID!): Message
    }

    schema {
        query: Query
        subscription: Subscription
        mutation: Mutation
    }
`

