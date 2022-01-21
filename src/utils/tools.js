/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
const fs = require('fs-extra')
const path = require('path')

const { app, session } = require('@electron/remote')
import store from '@/store'

const md5 = require('js-md5')
const SALT = 'I AM FW'

const isDev = !app.isPackaged
const appRoot = isDev ? path.resolve(__dirname, '..', '..') : path.resolve(app.getAppPath(), '..', '..')
const userDataPath = path.resolve('E:\\Code\\webrtc-client\\dist_electron', isDev ? 'userData' : 'userData2')
const loginConfigPath = path.resolve(userDataPath, 'Config.json')
const userPath = app.getPath('userData')

fs.ensureDir(userDataPath)
function getUserConfigPath () {
  return path.resolve(userDataPath, loadLocalConfig('Session', true).UserID.toString(), 'Config.json')
}
export function md5Encrypt (msg) {
  msg += SALT
  return md5(msg)
}
export function writeLocalConfig (section, key, value, isLoginConfig = false) {
  console.log('write config: ', section, key, value)
  const configPath = isLoginConfig ? loginConfigPath : getUserConfigPath()
  fs.ensureDir(path.dirname(configPath))
  if (fs.existsSync(configPath)) {
    const mainConfig = fs.readJSONSync(configPath)
    if (!mainConfig[section]) mainConfig[section] = {}
    mainConfig[section][key] = value
    fs.writeJSONSync(configPath, mainConfig)
  } else {
    fs.writeJSONSync(configPath, {})
  }
}
let routerSave = null
export function routerJump (router, path, replace = false) {
  if (router) routerSave = router
  else router = routerSave

  if (path === './') window.location.href = './index.html'
  else if (replace) router.replace({ path })
  else router.push(path)
}
export function loadLocalConfig (section, isLoginConfig = false) {
  const configPath = isLoginConfig ? loginConfigPath : getUserConfigPath()
  fs.ensureDir(path.dirname(configPath))
  if (fs.existsSync(configPath)) {
    try {
      const mainConfig = fs.readJSONSync(configPath)
      return mainConfig[section]
    } catch {
      const newConfig = getTemplateConfig()
      fs.writeJSONSync(configPath, newConfig)
      return newConfig[section]
    }
  } else {
    const newConfig = getTemplateConfig()
    fs.writeJSONSync(configPath, newConfig)
    return newConfig[section]
  }
}
export async function writeSessionStorage (key, object) {
  console.log('write', key, object)
  await session.defaultSession.cookies.set({ url: 'http://streamer.hellobaka.xyz', value: JSON.stringify(object), name: key })
    .catch((error) => {
      console.error(error)
    })
  // Cookies.set(key, JSON.stringify(object), { path: 'http://streamer.hellobaka.xyz' })
  // app.global.Application[key] = object
}
export async function readSessionStorage (key) {
  const result = await session.defaultSession.cookies.get({ url: 'http://streamer.hellobaka.xyz' })
  const r = JSON.parse(result.find(x => x.name === key)?.value || null)
  console.log('read', key, r)
  return r
  // console.log(Cookies.get())
  // return JSON.parse(Cookies.get(key) || null)
  // return app.global.Application[key]
}
export function getTemplateConfig () {
  const Config = {
    LoginConfig: {
      rememberPassword: false,
      autoLogin: false,
      account: '',
      password: ''
    },
    Config: {
      themeColor: '#3f51b5',
      bitrate_Stream: 9000,
      framerate_Stream: 60,
      bitrate_Client: 9000,
      framerate_Client: 60,
      audio_Input: '',
      audio_Output: '',
      input: '',
      inputDeviceID: '',
      outputDeviceID: '',
      danmukuDefault: true,
      danmukuRemember: true,
      p2pAssist: true,
      stunServer: '',
      turnServer: ''
    }
  }
  return Config
}

export function rulesVerify (result) {
  if (typeof result === 'string') return false
  return result
}
