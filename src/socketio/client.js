const url = 'ws://127.0.0.1:6235/main'
let reconnectCount = 0

const { Info } = require('../utils/dialog')
const { writeSessionStorage, routerJump, readSessionStorage } = require('../utils/tools')

Window.$WebSocket = { connection: new WebSocket(url) }
const server = Window.$WebSocket
init()
const onList = []
function reconnect () {
  reconnectCount++
  console.log(`Try reconnect to Server, times: ${reconnectCount}`)
  setTimeout(() => {
    server.connection = new WebSocket(url)
    init()
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
  server.connection.onclose = async (e) => {
    console.log('Disconnect from Server.')
    if (this.OnClose) this.OnClose()
    reconnect()
  }
  server.connection.onerror = (e) => {
    console.log(`Connection Error, ${e}`)
  }
  server.connection.onopen = async (e) => {
    reconnectCount = 0
    console.log('Connected to Server.')
    const token = readSessionStorage('JWT')
    Emit('GetInfo', { type: 'client', jwt: token || '' })
    if (this.OnOpen) this.OnOpen()
  }
}
function Emit (type, msg) {
  if (server.connection.readyState !== 1) {
    onList[type]({ msg: '未与服务器建立连接' })
    return false
  }
  server.connection.send(JSON.stringify({ type, data: msg }))
  return true
}

function On (type, callback) {
  onList[type] = callback
}

server.On = On
server.Emit = Emit
server.user = {}
server.delay = 0
server.On('HeartBeat', (data) => {
  server.delay = Math.abs(new Date().getTime() - parseInt(data.timestamp) + 28800000)
})
server.On('GetInfoResult', async (data) => {
  console.log('InfoResult: ', data)
  if (data.code !== 200) {
    writeSessionStorage('user', null)
    writeSessionStorage('JWT', '')
    await Info(data.msg)
    server.TempGetInfoCallback(data)
    server.TempGetInfoCallback = (data) => {}
    routerJump(null, './', true)
  } else {
    if (data.data) {
      server.user = data.data
      writeSessionStorage('user', data.data)
    }
    server.TempGetInfoCallback(data)
    server.TempGetInfoCallback = (data) => {}
  }
})
server.TempGetInfoCallback = (data) => {}

setInterval(() => {
  if (server.connection.readyState === 1) {
    Emit('HeartBeat', '##HEARTBEAT##')
  }
}, 5000)
