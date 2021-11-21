const url = 'ws://127.0.0.1:6235/main'
let reconnectCount = 0

Window.$WebSocket = { connection: new WebSocket(url) }
const server = Window.$WebSocket
const onList = []
server.connection.onopen = (e) => {
  console.log('Connected to Server.')
  init()
}
function reconnect () {
  reconnectCount++
  console.log(`Try reconnect to Server, times: ${reconnectCount}`)
  setTimeout(() => {
    server.connection = new WebSocket(url)
    init()
    server.connection.onopen = (e) => {
      console.log('Reconnected to Server.')
      reconnectCount = 0
    }
  }, 2000)
}
function init () {
  server.connection.onmessage = (e) => {
    const json = JSON.parse(e.data)
    if (json.type === 'HeartBeat') {
      onList[json.type](json.data)
    } else if (onList[json.type]) {
      onList[json.type](json.data.msg)
    }
  }
  server.connection.onclose = (e) => {
    console.log('Disconnect from Server.')
    reconnect()
  }
  server.connection.onerror = (e) => {
    console.log(`Connection Error, ${e}`)
  }
}
function Emit (type, msg) {
  if (server.connection.readyState !== 1) throw new Error('No Connection With Server')
  server.connection.send(JSON.stringify({ type, data: msg }))
}

function On (type, callback) {
  onList[type] = callback
}

server.On = On
server.Emit = Emit
server.ID = ''
server.LastID = ''
server.LoginFlag = false
server.user = {}
server.On('HeartBeat', (data) => {
  console.log(`Ping: ${Math.abs(new Date().getTime() - parseInt(data.timestamp) + 28800000)}ms`)
})
server.On('SocketID', (data) => {
  console.log('getSocketID: ', data)
  server.LastID = server.ID
  server.ID = data
})
server.On('GetInfo', (data) => {
  const form = { flag: server.LoginFlag, socketID: '' }
  if (server.LoginFlag) {
    form.socketID = server.LastID
    server.user = data.data
    window.sessionStorage.setItem('user', JSON.stringify(data.data))
  }
  console.log('SendInfo: ', form)
  Emit('GetInfo', form)
})
server.On('GetInfoResult', (data) => {
  console.log('InfoResult: ', data)
  if (data.code !== 200) {
    // dialog relogin
    server.LastID = ''
    server.LoginFlag = false
  }
})

setInterval(() => {
  if (server.connection.readyState === 1) {
    Emit('HeartBeat', '##HEARTBEAT##')
  }
}, 5000)
