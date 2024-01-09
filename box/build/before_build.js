const client = require("./client/build")
const xfuture = require("./xfuture/build")

exports.default = async function(context) {
  return new Promise((resolve, reject) => {
    client.default().catch(err=>{
      reject(err)
      return
    })
    xfuture.default(context.platform.nodeName, context.arch).catch(err=>{
      reject(err)
      return
    })

    resolve(true)
  })
}