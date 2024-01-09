const { Tray, Menu, app } = require('electron')
const { mainWindowShow } = require('./window')
const { staticPathJoin } = require('./utils/utils')
const { relaunch } = require('./utils/system')
const { name_cn } = require('./package.json')

let tray = null
const initTray = async () => {
  tray = new Tray(staticPathJoin('icons', 'tray.png'))
  tray.setTitle(name_cn)
  tray.setToolTip(name_cn)
  tray.setContextMenu(Menu.buildFromTemplate([
    {label: '打开', type: 'normal', click: () => {
      mainWindowShow()
    }},
    {label: '清除缓存并重启', type: 'normal', click: () => {
      relaunch(true)
    }},
    {label: '退出', type: 'normal', click: () => {
      app.quit()
    }},
  ]))
  tray.on('click', () => {
    mainWindowShow()
  })
}

const destroyTray = async () => {
  if (tray && !tray.isDestroyed()) {
    tray.destroy()
  }
}

module.exports = {
  initTray,
  destroyTray,
}