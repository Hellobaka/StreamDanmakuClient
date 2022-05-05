/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
const fs = require('fs-extra')
const path = require('path')

const { app, session } = require('@electron/remote')
import store from '@/store'
import { clipboard } from 'electron'
import { Confirm } from './dialog'

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
export function md5Encrypt (msg, salt = true) {
  if (salt) msg += SALT
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
export function routerJump (router, path, replace = false) {
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
export function writeSessionStorage (key, object) {
  console.log('write', key, object)
  sessionStorage.setItem(key, JSON.stringify(object))
  // await session.defaultSession.cookies.set({ url: 'http://streamer.hellobaka.xyz', value: JSON.stringify(object), name: key })
  //   .catch((error) => {
  //     console.error(error)
  //   })
  // Cookies.set(key, JSON.stringify(object), { path: 'http://streamer.hellobaka.xyz' })
  // app.global.Application[key] = object
}
export function readSessionStorage (key) {
  return JSON.parse(sessionStorage.getItem(key))
}
export function copyText (text) {
  clipboard.writeText(text)
  this.snackbar.Success('复制成功')
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
      danmakuDefault: true,
      danmakuRemember: true
    }
  }
  return Config
}

export function rulesVerify (result) {
  if (typeof result === 'string') return false
  return result
}
export async function logout (router) {
  writeLocalConfig('Config', 'autoLogin', false)
  writeSessionStorage('user', null)
  routerJump(router, './', true)
}
const listener = []
export function addListener (event, callback) {
  listener[event] = callback
}
export function removeListener (event) {
  const index = listener.indexOf(event)
  if (index !== -1) listener.splice(index, 1)
}
export function emit (event, ...args) {
  if (listener[event]) {
    listener[event](...args)
  }
}
