/* eslint-disable no-unused-vars */
import { BrowserWindow, app } from '@electron/remote'
import { writeSessionStorage } from './tools'

app.global.Application.MainWindowID = 0
export function setMainWindowID (id) {
  app.global.Application.MainWindowID = id
}
export async function createChildWindow (url, client = true) {
  url = app.global.Application.BASE_URL + '#/' + url
  console.log('childWindow url: ', url)
  if (!url) return
  const childWin = new BrowserWindow({
    width: client ? 1600 : 450,
    height: client ? 900 : 600,
    minWidth: client ? 850 : 447,
    minHeight: client ? 420 : 200,
    transparent: !client,
    frame: client,
    show: false,
    title: 'child',
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })
  await writeSessionStorage('StreamFlag', true)
  // childWin.menuBarVisible = false
  require('@electron/remote/main').enable(childWin.webContents)
  const WindowsMap = app.global.Application.WindowsMap
  const MainWindowID = app.global.Application.MainWindowID === 0 ? 1 : app.global.Application.MainWindowID
  const ChildWindowID = childWin.id
  WindowsMap.set(childWin.id, childWin)
  const mainWindow = WindowsMap.get(MainWindowID)
  childWin.on('close', async () => {
    await writeSessionStorage('StreamFlag', false)
    WindowsMap.delete(ChildWindowID)
    if (mainWindow) {
      mainWindow.show()
    }
  })
  childWin.once('ready-to-show', async () => {
    childWin.show()
    childWin.webContents.openDevTools()
    if (mainWindow) {
      mainWindow.hide()
    }
  })
  childWin.loadURL(url)
}
