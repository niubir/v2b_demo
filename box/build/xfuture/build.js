const path = require('path')
const fs = require('fs')

const color = require('../util/color')

let platform = ''
let arch = ''

const xfutureNodeModulePath = path.join(__dirname, '../../node_modules/xfuture')
const xfutureStaticPath = path.join(__dirname, '../../static/xfuture')

let platform_arch_copy_files = {
  commons: [
    {
      from: path.join(xfutureNodeModulePath, 'resources'),
      to: path.join(xfutureStaticPath, 'resources'),
    },
  ],
  win32: {
    commons: [
      {
        from: path.join(xfutureNodeModulePath, 'package/windows'),
        to: path.join(xfutureStaticPath, 'package/windows'),
      },
    ],
  },
  darwin: {
    commons: [
      {
        from: path.join(xfutureNodeModulePath, 'package/mac'),
        to: path.join(xfutureStaticPath, 'package/mac'),
      },
    ],
  },
}

const fatalPoint = color.colorText('•', color.red)
const printPoint = color.colorText('•', color.blue)

const fatal = (err) => {
  console.log('  %s xfuture build failed!  %s', fatalPoint, color.colorText(err, color.red))
  throw new Error(err)
}
const print = (msg) => {
  console.log('  %s xfuture build %s', printPoint, msg)
}

const build = async (platformInParam, archInParam) => {
  if (platformInParam === 'win32' || platformInParam === 'darwin') {
    platform = platformInParam
  }
  if (archInParam === 'x64' || archInParam === 'arm64') {
    arch = archInParam
  }

  // check
  if (!platform) {
    fatal('platform:is empty')
  }
  if (!arch) {
    fatal('arch:is empty')
  }

  // rmdir
  try {
    fs.rmSync(xfutureStaticPath, {recursive: true})
  } catch(err) {
    let is_not_found_err = err.toString().includes('no such file or directory', 1)
    if (!is_not_found_err) {
      fatal(err.toString())
    }
  }

  // mkdir
  try {
    fs.mkdirSync(xfutureStaticPath)
  } catch(err) {
    let is_file_already_exists = err.toString().includes('file already exists', 1)
    if (!is_file_already_exists) {
      fatal(err.toString())
    }
  }

  // common files
  if (platform_arch_copy_files.commons && platform_arch_copy_files.commons.length > 0) {
    platform_arch_copy_files.commons.forEach((file) => {
      try {
        fs.cpSync(file.from, file.to, {recursive: true})
      } catch(err) {
        fatal(err)
      }
    })
  }

  // platform common files
  if (platform_arch_copy_files[platform] && platform_arch_copy_files[platform].commons && platform_arch_copy_files[platform].commons.length > 0) {
    platform_arch_copy_files[platform].commons.forEach((file) => {
      try {
        fs.cpSync(file.from, file.to, {recursive: true})
      } catch(err) {
        fatal(err)
      }
    })
  }

  // platform arch files
  if (platform_arch_copy_files[platform] && platform_arch_copy_files[platform][arch] && platform_arch_copy_files[platform][arch].length > 0) {
    platform_arch_copy_files[platform][arch].forEach((file) => {
      try {
        fs.cpSync(file.from, file.to, {recursive: true})
      } catch(err) {
        fatal(err)
      }
    })
  }

  print(color.colorText('platform', color.blue)+'='+platform+' '+color.colorText('arch', color.blue)+'='+arch+' ')
}

exports.default = build
