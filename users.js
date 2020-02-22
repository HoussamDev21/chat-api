module.exports = {
    list: [],
    join({ pubsub }, user) {
        let existingUser = this.list.find(u => u.username === user.username)
        if (existingUser) {
            existingUser.session = existingUser.session + 1
            console.log(`:: ${user.username} - session ${existingUser.session}`)
        } else {
            this.list.unshift({ ... user, session: 0 })
            pubsub.publish('ONLINE_USERS', { onlineUsers: this.list })
            console.log(`:: ${user.username} - join`)
        }
    },
    left({ pubsub }, user) {
        let index = this.list.findIndex(u => u.username === user.username)
        if (index > -1) {
            if (this.list[index].session === 0) {
                this.list.splice(index, 1)
                pubsub.publish('ONLINE_USERS', { onlineUsers: this.list })
                console.log(`:: ${user.username} - left`)
            } else {
                this.list[index].session = this.list[index].session - 1
                console.log(`:: ${user.username} - session ${this.list[index].session}`)
            }
        }
    }
}