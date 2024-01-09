const { app } = require('electron')
const { protocol } = require('./package.json')
const { initDebug } = require('./debug/main')
const { initSystem, handleArgv } = require('./utils/system')
const { cinfo } = require('./utils/color')
const { getXFutureConfig, initProxy } = require('./utils/proxy')
const { initTray } = require('./tray')
const { initWin, mainWindowShow, loadingWindowShow, loadingWindowHide } = require('./window')
const engine = require('xfuture/index')

const app_protocol = protocol
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

const init = async () => {
  cinfo('app', '***WHEN READY***')
  handleArgv(app_protocol, process.argv)
  await initDebug()
  await initSystem()
  await initProxy()
  await initTray()
  await initWin()

  mainWindowShow()

  app.on('before-quit', () => {
    cinfo('app', '***BEFORE QUIT SCRIPT***')
  })
  app.on('second-instance', (e, argv) => {
    cinfo('app', '***SECOND INSTANCE***')
    handleArgv(app_protocol, argv)
    mainWindowShow()
  })
  app.on('activate', () => {
    cinfo('app', '***ACTIVATE***')
    mainWindowShow()
  })
  app.on('window-all-closed', () => {
    cinfo('app', '***WINDOW ALL CLOSE***')
    if (process.platform === 'darwin') {
      app.dock.hide()
    }
  })
  app.setAsDefaultProtocolClient(app_protocol)
}

if (!app.requestSingleInstanceLock()) {
  cinfo('app', '***SINGLE INSTANCE LOCK***')
  app.quit()
} else {
  const xfuture_config = getXFutureConfig()
  engine.InstallDriver(xfuture_config.install_shell_path, xfuture_config.install_helper_path)
  engine.SetPassword(xfuture_config.password)

  app.whenReady().then(async () => {
    loadingWindowShow()
    setTimeout(()=>{
      loadingWindowHide()
    }, 500)
    init()
  })
}
