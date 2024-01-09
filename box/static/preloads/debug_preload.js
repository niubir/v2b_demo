const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  ListenLog: (cb) => ipcRenderer.on('LOG', (e, ...args) => {
    for (let arg of args) {
      cb(arg)
    }
  })
})