var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.get('/', (req, res) => {
    res.end('chat')
})

io.on('connection', (socket) => {
    console.log('a user connected')

    socket.on('message', (msg) => {
        io.emit('message', msg)
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})

http.listen(process.env.PORT, function() {
    console.log('listening on', process.env.PORT)
})