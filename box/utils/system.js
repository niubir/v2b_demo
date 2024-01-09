const { app, shell, BrowserWindow } = require('electron')
const systemOS = require('os')
const { machineIdSync } = require('node-machine-id')
const crypto = require('crypto')
// https://systeminformation.io
const si = require('systeminformation')

const { cerror } = require('./color')
const { version } = require('../package.json')
const { registeIPCHandle, sendIPC } = require('../ipc/main')
const { notifyLog, level_error } = require('../debug/main')
const { Close } = require('./proxy')

let device_info = {
  version: version,
  platform: process.platform,
  platform_version: systemOS.release(),
  arch: systemOS.arch(),
  uuid: crypto.createHash('md5').update(machineIdSync()).digest('hex'),
  unique_code: '00:00:00:00:00:00',
  country_code: app.getLocaleCountryCode(),
}

const initSystem = async () => {
  registeIPCHandle('DeviceInfo', (e, ...args)=>{
    return device_info
  })
  registeIPCHandle('System', (e, ...args)=>{
    return system()
  })
  registeIPCHandle('OS', (e, ...args)=>{
    return os()
  })
  registeIPCHandle('FS', (e, ...args)=>{
    return fs()
  })
  registeIPCHandle('Networks', (e, ...args)=>{
    return networks()
  })
  registeIPCHandle('CPU', (e, ...args)=>{
    return cpu()
  })
  registeIPCHandle('Memory', (e, ...args)=>{
    return memory()
  })
  registeIPCHandle('Battery', (e, ...args)=>{
    return battery()
  })
  registeIPCHandle('Graphics', (e, ...args)=>{
    return graphics()
  })
  registeIPCHandle('OpenURL', (e, ...args)=>{
    if (args.length > 0 && args[0]) {
      openURL(args[0])
    }
  })
  registeIPCHandle('Relaunch', (e, ...args)=>{
    let clearStorage = false
    if (args.length > 0) {
      clearStorage = args[0]
    }
    relaunch(clearStorage)
  })
}

const relaunch = (clearStorage) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (clearStorage && !win.isDestroyed()) {
      win.webContents.session.clearStorageData({
        storages: ['appcache', 'filesystem', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
      })
    }
  })
  Close().catch(err=>{
    cerror('system', 'relaunch close proxy failed:', err)
  })
  app.relaunch()
  app.exit()
}

const system = async () => {
  return si.system()
}

const os = async () => {
  return si.osInfo()
}

const fs = async () => {
  return si.fsSize()
}

const networks = async () => {
  return si.networkInterfaces()
}

const cpu = async () => {
  return si.cpu()
}

const memory = async () => {
  return si.mem()
}

const battery = async () => {
  return si.battery()
}

const graphics = async () => {
  return si.graphics()
}

const openURL = async (url) => {
  shell.openExternal(url).catch(err=>{
    notifyLog('SYSTEM', level_error, err.toString())
  })
}

const handleArgv = (app_protocol, argv) => {
  const url = argv.find(v => v.indexOf(`${app_protocol}:`) !== -1)
  if (url) {
    const urlOBJ = new URL(url)
    const iterator = urlOBJ.searchParams.entries()
    let params = {}
    for(let next = iterator.next(); !next.done; next = iterator.next()) {
      if (next.value.length > 0) {
        const v = next.value.splice(1)
        switch (v.length) {
          case 0:
            params[next.value[0]] = null
            break
          case 1:
            params[next.value[0]] = v[0]
            break
          default:
            params[next.value[0]] = v
            break
        }
      }
    }
    syncArgv(urlOBJ.pathname, params)
  }
}

const syncArgv = (path, params) => {
  sendIPC('ListenArg', { path: path, params: params})
}

module.exports = {
  initSystem,
  relaunch,
  system,
  os,
  fs,
  networks,
  cpu,
  memory,
  battery,
  graphics,
  openURL,
  handleArgv,
}