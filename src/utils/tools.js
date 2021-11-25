/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
const fs = require('fs-extra')
const path = require('path')

const { app } = require('@electron/remote')
import store from '@/store'

const md5 = require('js-md5')
const SALT = 'I AM FW'

const isDev = !app.isPackaged

const appRoot = isDev ? path.resolve(__dirname, '..', '..') : path.resolve(app.getAppPath(), '..', '..')
const userDataPath = path.resolve('E:\\Code\\webrtc-client\\dist_electron', 'userData')
const userConfigPath = path.resolve(userDataPath, 'Config.json')
const userPath = app.getPath('userData')
fs.ensureDir(userDataPath)
console.log(userConfigPath)
export function md5Encrypt (msg) {
  msg += SALT
  return md5(msg)
}
export function writeLocalConfig (section, key, value) {
  if (fs.existsSync(userConfigPath)) {
    const mainConfig = fs.readJSONSync(userConfigPath)
    if (!mainConfig[section]) mainConfig[section] = {}
    mainConfig[section][key] = value
    fs.writeJSONSync(userConfigPath, mainConfig)
  } else {
    fs.writeJSONSync(userConfigPath, {})
  }
}
export function loadLocalConfig (section) {
  if (fs.existsSync(userConfigPath)) {
    try {
      const mainConfig = fs.readJSONSync(userConfigPath)
      return mainConfig[section]
    } catch {
      const newConfig = getTemplateConfig()
      fs.writeJSONSync(userConfigPath, newConfig)
      return newConfig[section]
    }
  } else {
    const newConfig = getTemplateConfig()
    fs.writeJSONSync(userConfigPath, newConfig)
    return newConfig[section]
  }
}
export function writeSessionStorage (key, object) {
  app.global.Application[key] = object
}
export function readSessionStorage (key) {
  return app.global.Application[key]
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
      themeColor: '',
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
