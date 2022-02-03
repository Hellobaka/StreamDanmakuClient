let sizeSave = []
let positionSave = []
export function LoadStreamerURL (router, url, isClient = false) {
  const MainWindow = require('@electron/remote').getCurrentWindow()
  sizeSave = MainWindow.getSize()
  positionSave = MainWindow.getPosition()
  MainWindow.hide()
  if (isClient) {
    MainWindow.setMinimumSize(850, 420)
    MainWindow.setSize(1600, 900)
  } else {
    MainWindow.setMinimumSize(447, 200)
    MainWindow.setSize(450, 600)
  }
  router.push(url)
}
export function RestoreWindow () {
  const MainWindow = require('@electron/remote').getCurrentWindow()
  MainWindow.setMinimumSize(850, 420)
  MainWindow.setSize(sizeSave[0], sizeSave[1])
  MainWindow.setPosition(positionSave[0], positionSave[1])
  MainWindow.show()
}
