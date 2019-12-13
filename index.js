var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('message', (msg) => {
        io.emit('message', msg)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

http.listen(3000, function() {
    console.log('listening on *:3000')
})