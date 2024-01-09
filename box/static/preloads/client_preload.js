const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // window
  WinMaximizeChange: () => invoke('WinMaximizeChange'),
  WinMinimize: () => invoke('WinMinimize'),
  WinClose: () => invoke('WinClose'),
  WinChangeWidth: (height, animationTime) => invoke('WinChangeWidth', height, animationTime),

  // debug
  OpenDevTools: () => invoke('OpenDevTools'),
  OpenDebugTools: () => invoke('OpenDebugTools'),

  // proxy
  Proxy: (...args) => invoke('Proxy', ...args),
  ProxyReload: (...args) => invoke('ProxyReload', ...args),
  ProxyConfigNodesBySubURL: (...args) => invoke('ProxyConfigNodesBySubURL', ...args),
  ProxyConfigNodesByNodeURLs: (...args) => invoke('ProxyConfigNodesByNodeURLs', ...args),
  ProxyConfigNodesByNodeURLMetas: (...args) => invoke('ProxyConfigNodesByNodeURLMetas', ...args),
  ProxyConfigAllow: (...args) => invoke('ProxyConfigAllow', ...args),
  ProxyRefreshNodeDelay: (...args) => invoke('ProxyRefreshNodeDelay', ...args),
  ProxyStart: (...args) => invoke('ProxyStart', ...args),
  ProxyChangeType: (...args) => invoke('ProxyChangeType', ...args),
  ProxyChangeMode: (...args) => invoke('ProxyChangeMode', ...args),
  ProxyChangeNode: (...args) => invoke('ProxyChangeNode', ...args),
  ProxyClose: (...args) => invoke('ProxyClose', ...args),
  ProxyListen: (cb) => on('ProxyListen', cb),
  ProxySpeedListen: (cb) => on('ProxySpeedListen', cb),

  // system
  DeviceInfo: () => invoke('DeviceInfo'),
  System: () => invoke('System'),
  OS: () => invoke('OS'),
  FS: () => invoke('FS'),
  Networks: () => invoke('Networks'),
  CPU: () => invoke('CPU'),
  Memory: () => invoke('Memory'),
  Battery: () => invoke('Battery'),
  Graphics: () => invoke('Graphics'),
  OpenURL: (url) => invoke('OpenURL', url),
  OpenURLWindow: (url) => invoke('OpenURLWindow', url),
  Relaunch: (clearStorage) => invoke('Relaunch', clearStorage),
  ListenCloseURLWindow: (cb) => on('ListenCloseURLWindow', cb),
  ListenArg: (cb) => on('ListenArg', cb),
})

const on = (chan, cb) => {
  ipcRenderer.on(chan, (e, ...args) => {
    log(`On(${chan})`, args)
    cb(args[0])
  })
}

const invoke = (chan, ...args) => {
  log(`Invoke(${chan}) Req`, args)
  return new Promise((resolve, reject) => {
    ipcRenderer.invoke(chan, ...args).then((data) => {
      log(`Invoke(${chan}) Resp`, data)
      resolve(data)
    }).catch(err=>{
      error(`Invoke(${chan}) Error`, err)
      err = err + ''
      err = err.replace('Error: Error invoking remote method \''+chan+'\': ', '')
      reject(err)
    })
  })
}

const log = (msg, data) => {
  // console.info(`[${new Date}] api ${msg}`, data)
}

const error = (msg, err) => {
  console.error(`[${new Date}] api ${msg}`, err)
}