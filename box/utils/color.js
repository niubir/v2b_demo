const util = require('util')

const dft = 'dft'
const gray = 'gray'
const red = 'red'
const green = 'green'
const yellow = 'yellow'
const blue = 'blue'
const magenta = 'magenta'
const cyan = 'cyan'

const color_map = {
  dft: '\x1B[29m%s\x1B\x1B[0m',
  gray: '\x1B[30m%s\x1B\x1B[0m',
  red: '\x1B[31m%s\x1B\x1B[0m',
  green: '\x1B[32m%s\x1B\x1B[0m',
  yellow: '\x1B[33m%s\x1B\x1B[0m',
  blue: '\x1B[34m%s\x1B\x1B[0m',
  magenta: '\x1B[35m%s\x1B\x1B[0m',
  cyan: '\x1B[36m%s\x1B\x1B[0m',
}

const colorTexts = (color, ...param) => {
  let txts = []
  for (let p of param) {
    switch (typeof p) {
      case 'string': case 'number': case 'boolean': case 'symbol': case 'undefined': case 'null':
        txts.push(p)
        break
      default:
        let txt = JSON.stringify(p)
        if (txt === '{}') {
          txt = util.format('%s', p)
        }
        txts.push(txt)
        break
    }
  }
  return colorText(color, util.format(...txts))
}

const colorText = (color, text) => {
  let tmp = color_map[color]
  if (!tmp) {
    tmp = color_map[dft]
  }
  return util.format(tmp, text)
}

const clog = (title, ...param) => {
  console.log(colorText(magenta, `[${title}]`), colorTexts(blue, ...param))
}

const cinfo = (title, ...param) => {
  console.log(colorText(magenta, `[${title}]`), colorTexts(cyan, ...param))
}

const cwarning = (title, ...param) => {
  console.log(colorText(magenta, `[${title}]`), colorTexts(yellow, ...param))
}

const cerror = (title, ...param) => {
  console.error(colorText(magenta, `[${title}]`), colorTexts(red, ...param))
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
  clog,
  cinfo,
  cwarning,
  cerror,
}