const { app } = require('electron')
const path = require('path')
const fs = require('fs')

const staticPathJoin = (...args) => {
  let dir = ''
  if (isProduction()) {
    dir = path.join(process.resourcesPath, 'static')
  } else {
    dir = path.join(__dirname, '../static')
  }
  return path.join(dir, ...args)
}

const userPathJoin = (...args) => {
  return path.join(app.getPath('userData'), ...args)
}

const mkdirs = (dir) => {
  if (fs.existsSync(dir)) {
    return
  } else {
    mkdirs(path.dirname(dir))
    fs.mkdirSync(dir)
  }
}

const isProduction = () => {
  return __dirname.split(path.sep).indexOf("app.asar") >= 0
}

module.exports = {
  isProduction,
  staticPathJoin,
  userPathJoin,
  mkdirs,
}