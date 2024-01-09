const util = require('util')

const gray = 'gray'
const red = 'red'
const green = 'green'
const yellow = 'yellow'
const blue = 'blue'
const magenta = 'magenta'
const cyan = 'cyan'

const color_map = {
  gray: '\x1B[30m%s\x1B\x1B[0m',
  red: '\x1B[31m%s\x1B\x1B[0m',
  green: '\x1B[32m%s\x1B\x1B[0m',
  yellow: '\x1B[33m%s\x1B\x1B[0m',
  blue: '\x1B[34m%s\x1B\x1B[0m',
  magenta: '\x1B[35m%s\x1B\x1B[0m',
  cyan: '\x1B[35m%s\x1B\x1B[0m',
  default: '\x1B[29m%s\x1B\x1B[0m',
}

const colorText = (text, color) => {
  let tmp = color_map[color]
  if (!tmp) {
    tmp = color_map['default']
  }
  return util.format(tmp, text)
}

module.exports = {
  gray,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  colorText,
}