const url = 'ws://127.0.0.1:6235/main'
let reconnectCount = 0

const { Info } = require('../utils/dialog')
const { readSessionStorage, writeSessionStorage, loadLocalConfig, routerJump, writeLocalConfig } = require('../utils/tools')

Window.$WebSocket = { connection: new WebSocket(url) }
const server = Window.$WebSocket
init()
let streamFlag = null
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
    reconnect()
  }
  server.connection.onerror = (e) => {
    console.log(`Connection Error, ${e}`)
  }
  server.connection.onopen = async (e) => {
    reconnectCount = 0
    if (!streamFlag) streamFlag = await readSessionStorage('StreamFlag')
    console.log('Connected to Server.')
    if (streamFlag) {
      Emit('GetInfo', { loginFlag: true, jwt: loadLocalConfig('JWT').token, streamFlag: true })
    } else if (!streamFlag && await readSessionStorage('LoginFlag')) {
      Emit('GetInfo', { loginFlag: true, jwt: loadLocalConfig('JWT').token })
    } else {
      Emit('GetInfo', { loginFlag: false })
    }
    // await writeSessionStorage('user', null)
  }
}
// eslint-disable-next-line no-unused-vars
async function CallStreamGetInfo () {
  if (streamFlag) {
    Emit('GetInfo', { loginFlag: true, jwt: loadLocalConfig('JWT').token, streamFlag: true })
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
server.CallStreamGetInfo = CallStreamGetInfo
server.user = {}
server.delay = 0
server.On('HeartBeat', (data) => {
  server.delay = Math.abs(new Date().getTime() - parseInt(data.timestamp) + 28800000)
})
server.On('GetInfoResult', async (data) => {
  console.log('InfoResult: ', data)
  if (data.code !== 200) {
    await writeSessionStorage('user', null)
    await writeSessionStorage('LoginFlag', false)
    await Info(data.msg)
    server.TempGetInfoCallback(data)
    server.TempGetInfoCallback = (data) => {}
    routerJump(null, './', true)
  } else {
    if (data.data) {
      await writeSessionStorage('user', data.data)
      await writeSessionStorage('LoginFlag', true)
      writeLocalConfig('Session', 'UserID', data.data.Id, true)
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
