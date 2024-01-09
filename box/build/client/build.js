const path = require('path')
const fs = require('fs')
const color = require('../util/color')

const fatalPoint = color.colorText('•', color.red)
const printPoint = color.colorText('•', color.blue)

const fatal = (err) => {
  console.log('  %s client build failed!  %s', fatalPoint, color.colorText(err, color.red))
  throw new Error(err)
}
const print = (msg) => {
  console.log('  %s client build %s', printPoint, msg)
}

const dist_path = path.join(__dirname, '../../../web/dist')
const client_path = path.join(__dirname, '../../static/client')

const build = async () => {
  // rmdir
  try {
    fs.rmSync(client_path, {recursive: true})
  } catch(err) {
    let is_not_found_err = err.toString().includes('no such file or directory', 1)
    if (!is_not_found_err) {
      fatal(err.toString())
    }
  }

  // mkdir
  try {
    fs.mkdirSync(client_path)
  } catch(err) {
    fatal(err.toString())
  }

  // copy dir
  try {
    fs.cpSync(dist_path, client_path, {recursive: true})
  }catch(err) {
    let is_not_found_err = err.toString().includes('no such file or directory', 1)
    if (!is_not_found_err) {
      fatal(err.toString())
    }
  }

  print(color.colorText('completed', color.blue))
}

exports.default = build