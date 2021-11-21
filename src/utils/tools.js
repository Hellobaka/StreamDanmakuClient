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
    mainConfig[section][key] = value
    fs.writeJSONSync(userConfigPath, mainConfig)
  } else {
    fs.writeJSONSync(userConfigPath, {})
  }
}
export function loadLocalConfig () {
  if (fs.existsSync(userConfigPath)) {
    const mainConfig = fs.readJSONSync(userConfigPath)
    for (const config in mainConfig) {
      store.commit('loadConfig', { section: config, payload: mainConfig[config] })
    }
    console.log('Load Local Config Success.')
  } else {
    fs.writeJSONSync(userConfigPath, {})
  }
}
