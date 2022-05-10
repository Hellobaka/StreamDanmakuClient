/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
const fs = require('fs-extra')
const path = require('path')

const { app, session } = require('@electron/remote')
import store from '@/store'
import { clipboard } from 'electron'
import { resetRouter } from '../router'
const snackbar = require('@/utils/snackbar').default
import { Confirm } from './dialog'

const md5 = require('js-md5')
const SALT = 'I AM FW'

const isDev = !app.isPackaged
const appRoot = isDev ? path.resolve(__dirname, '..', '..') : path.resolve(app.getAppPath(), '..')
const userDataPath = path.resolve(appRoot, 'userData')
console.log(userDataPath)
const configPath = path.resolve(userDataPath, 'Config.json')
fs.ensureDir(userDataPath)
export function md5Encrypt (msg, salt = true) {
  if (salt) msg += SALT
  return md5(msg)
}
export function writeLocalConfig (section, key, value) {
  console.log('write config: ', section, key, value)
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
export function routerJump (router, path, clearHistory = false) {
  if (clearHistory) {
    resetRouter()
    router.push(path)
  } else router.push(path)
}
export function loadLocalConfig (section) {
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
}
export function readSessionStorage (key) {
  return JSON.parse(sessionStorage.getItem(key))
}
export function copyText (text) {
  clipboard.writeText(text)
  snackbar.Success('复制成功')
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
      server: 'ws://127.0.0.1:6235/main',
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
  writeSessionStorage('JWT', null)
  Window.$WebSocket.Emit('logout')
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
export function getAppVersion () {
  return require('@electron/remote').app.getVersion()
}
export function callExe (args) {
  const { exec } = require('child_process')
  const updatePath = path.resolve(appRoot, 'StreamDanmaku_Updater.exe')
  exec(`${updatePath} ${args}`, () => {
    require('@electron/remote').app.exit()
  })
}
