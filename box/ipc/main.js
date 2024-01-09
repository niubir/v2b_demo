const { ipcMain, BrowserWindow } = require('electron')

const registeIPCHandle = (chan, handler) => {
  ipcMain.handle(chan, (e, ...args) => {
    return handler(e, ...args)
  })
}

const sendIPC = (chan, data) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(chan, data)
    }
  })
}

module.exports = {
  registeIPCHandle,
  sendIPC,
}