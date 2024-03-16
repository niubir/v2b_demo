const { BrowserWindow, Menu, screen, dialog } = require('electron')
const { cerror } = require('./utils/color')
const { staticPathJoin, isProduction } = require('./utils/utils')
const { registeIPCHandle, sendIPC } = require('./ipc/main')

const { name_cn } = require('./package.json')
const iconPath = staticPathJoin('icons', 'window.png')


const initWin = ()=>{
  Menu.setApplicationMenu(null)
  registeIPCHandle('WinMaximizeChange', (e, ...args)=>{
    mainWindowMaximizeChange()
  })
  registeIPCHandle('WinMinimize', (e, ...args)=>{
    mainWindowMinimize()
  })
  registeIPCHandle('WinClose', (e, ...args)=>{
    mainWindowClose()
  })
  registeIPCHandle('OpenURLWindow', (e, ...args)=>{
    if (args.length > 0 && args[0]) {
      openURLWindow(args[0])
    }
  })
}

let mainWindow = null
const mainWindowFile = staticPathJoin('client', 'index.html')
const mainWindowNew = () => {
  let size = winSize()
  mainWindow = new BrowserWindow({
    title: name_cn,
    width: size.width,
    minWidth: size.width,
    maxWidth: size.maxWidth,
    height: size.height,
    minHeight: size.height,
    maxHeight: size.maxHeight,
    transparent: true,
    backgroundColor: '#00000000',
    // frame: false,
    resizable: true,
    webPreferences: {
      preload: staticPathJoin('preloads', 'client_preload.js'),
      devTools: !isProduction(),
      zoomFactor: 1.0,
    },
    icon: iconPath,
  })
  mainWindow.setMenu(null)
  if (isProduction()) {
    mainWindow.loadFile(mainWindowFile).catch(err=>{
      dialog.showErrorBox('加载页面失败', err.toString())
    })
  } else {
    if (process.env.MAIN_WINDOW_LOCAL) {
      mainWindow.loadURL('http://localhost:10001').catch(err=>{
      dialog.showErrorBox('加载页面失败', err.toString())
      })
    } else {
      mainWindow.loadFile(mainWindowFile).catch(err=>{
        dialog.showErrorBox('加载页面失败', err.toString())
      })
    }
    mainWindow.webContents.openDevTools()
  }
}
const mainWindowShow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindowNew()
  } else {
    mainWindow.show()
  }
}
const mainWindowHide = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
}
const mainWindowMaximizeChange = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindowUnmaximize()
    } else {
      mainWindowMaximize()
    }
  }
}
const mainWindowUnmaximize = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.unmaximize()
  }
}
const mainWindowMaximize = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.maximize()
  }
}
const mainWindowMinimize = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
}
const mainWindowClose = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close()
  }
}
const mainWindowClearStorage = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const clearObj = {
      storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
    }
    mainWindow.webContents.session.clearStorageData(clearObj).then(() => {
      mainWindow.reload()
    }).catch(err=>{
      cerror('window', 'clear storage failed:', err)
    })
  }
}

let loadingWindow = null
const loadingWindowFile = staticPathJoin('loading', 'index.html')
const loadingWindowNew = () => {
  loadingWindow = new BrowserWindow({
    title: name_cn,
    width: 300,
    height: 200,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    webPreferences: {
      devTools: !isProduction(),
      zoomFactor: 1.0,
    },
    icon: iconPath,
  })
  loadingWindow.setMenu(null)
  loadingWindow.loadFile(loadingWindowFile).catch(err=>{
    cerror('window', '加载Loading页面失败:', err)
  })
  // loadingWindow.webContents.openDevTools()
}
const loadingWindowShow = () => {
  if (!loadingWindow || loadingWindow.isDestroyed()) {
    loadingWindowNew()
  } else {
    loadingWindow.show()
  }
}
const loadingWindowHide = () => {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.destroy()
  }
}

const openURLWindow = async({
  id = '',
  url = '',
  title = name_cn,
  width = 500,
  minWidth = 500,
  height = 750,
  minHeight = 750,
  child = false,
}) => {
  return new Promise((resolve, reject) => {
    var regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
    if (!regex.test(url)) {
      reject('is invalid url')
      return
    }
    if (child && (!mainWindow || mainWindow.isDestroyed())) {
      reject('main win isDestroyed')
      return
    }
    let newWin = new BrowserWindow({
      title: title,
      width: width,
      minWidth: minWidth,
      height: height,
      minHeight: minHeight,
      icon: iconPath,
      modal: child ? true : false,
      parent: child ? mainWindow : null,
    })
    newWin.webContents.once('dom-ready', () => {
      resolve()
    })
    if (id) {
      newWin.on('close', ()=>{
        syncCloseURLWindow(id)
      })
    }
    newWin.loadURL(url)
  })
}
const syncCloseURLWindow = (id) => {
  sendIPC('ListenCloseURLWindow', id)
}
const winSize = () => {
  let width = 500
  let height = 750
  let maxWidth = 500
  let maxHeight = 750
  return {
    width: width,
    height: height,
    maxWidth: maxWidth,
    maxHeight: maxHeight,
  }
}

module.exports = {
  initWin,

  mainWindowShow,
  mainWindowHide,
  mainWindowClearStorage,

  loadingWindowShow,
  loadingWindowHide,
}