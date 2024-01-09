// const { notarize } = require('electron-notarize')
const { notarize } = require('@electron/notarize')

const color = require('./util/color')

const printPoint = color.colorText('•', color.blue)
console.log('  %s notarizing', printPoint)

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context  
  switch (electronPlatformName) {
    case 'darwin':
      const appName = context.packager.appInfo.productFilename
      return await notarize({
        tool: 'notarytool',
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.MAC_APPLE_ID,
        appleIdPassword: process.env.MAC_APPLE_ID_PASSWORD,
        teamId: process.env.MAC_TEAM_ID,
      })
    case 'win32':
      return new Promise((resolve, reject) => {
        resolve()
      })
    default:
      return new Promise((resolve, reject) => {
        reject(`Unsupport platform ${electronPlatformName}`)
      })
  }
}
