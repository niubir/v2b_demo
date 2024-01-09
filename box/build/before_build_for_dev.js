const os = require('os')
const client = require('./client/build')
const xfuture = require('./xfuture/build')

client.default().catch(err=>{
  throw err
})

xfuture.default(process.platform, os.arch()).catch(err=>{
  throw err
})
