/* eslint-disable no-unused-vars */
import { BrowserWindow, app } from '@electron/remote'

app.global.Application.MainWindowID = 0
export function setMainWindowID (id) {
  app.global.Application.MainWindowID = id
}
export function createChildWindow (url) {
  url = app.global.Application.BASE_URL + '#/' + url
  console.log('childWindow url: ', url)
  if (!url) return
  const childWin = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 850,
    minHeight: 420,
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
  require('@electron/remote/main').enable(childWin.webContents)
  const WindowsMap = app.global.Application.WindowsMap
  const MainWindowID = app.global.Application.MainWindowID === 0 ? 1 : app.global.Application.MainWindowID
  const ChildWindowID = childWin.id
  WindowsMap.set(childWin.id, childWin)
  const mainWindow = WindowsMap.get(MainWindowID)
  childWin.on('closed', () => {
    WindowsMap.delete(ChildWindowID)
    if (mainWindow) {
      mainWindow.show()
    }
  })
  childWin.once('ready-to-show', () => {
    childWin.show()
  })
  if (mainWindow) {
    mainWindow.hide()
  }
  childWin.loadURL(url)
}
