const { globalShortcut, BrowserWindow } = require('electron')
const { staticPathJoin, isProduction } = require('../utils/utils')
const { registeIPCHandle } = require('../ipc/main')

const { debug: { webDevToolShortKey, loggerShortKey } } = require('../package.json')

const level_debug = "DEBUG"
const level_warn = "WARN"
const level_error = "ERROR"
const level_info = "INFO"

const initDebug = () => {
  if (webDevToolShortKey) {
    globalShortcut.register(webDevToolShortKey, () => {
      let focusWin = BrowserWindow.getFocusedWindow()
      if (focusWin && !focusWin.isDestroyed()) {
        try {
          focusWin.webContents.openDevTools()
        } catch(err) {
          console.error(err)
        }
      }
    })
  }
  if (loggerShortKey) {
    globalShortcut.register(loggerShortKey, () => {
      initWin()
    })
  }

  registeIPCHandle('OpenDevTools', (e, ...args)=>{
    return new Promise((resolve, reject) => {
      let focusWin = BrowserWindow.getFocusedWindow()
      if (focusWin && !focusWin.isDestroyed()) {
        try {
          focusWin.webContents.openDevTools()
          resolve()
        } catch(err) {
          reject(err)
        }
      }
    })
  })
  registeIPCHandle('OpenDebugTools', (e, ...args)=>{
    initWin()
  })
  registeIPCHandle('Debug', (e, ...args)=>{
    if (args.length > 0) {
      let info = args[0]
      return notifyLog(info.chan?info.chan:'UNKNOW', info.level?info.level:level_debug, info.info?info.info:'UNKNOW')
    }
  })
}

let win = null

const initWin = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: staticPathJoin('preloads', 'debug_preload.js')
    }
  })
  win.setMenu(null)
  win.loadFile(staticPathJoin('htmls', 'debug.html'))
}

const notifyLog = (chan, level, info) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send('LOG', {
      Chan: chan,
      Date: new Date(),
      Level: level,
      Info: info,
    })
  }
}

module.exports = {
  initDebug,
  notifyLog,
  level_debug,
  level_warn,
  level_error,
  level_info,
}