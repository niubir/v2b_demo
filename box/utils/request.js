const https = require('https')
const http = require('http')
const url_util = require('url')

const request = ({method='GET', url='', opts={}}) => {
  return new Promise((resolve, reject) => {
    try {
      url = url_util.parse(url)
    } catch (err) {
      reject(`解析请求URL异常, ${err}`)
      return
    }
    try {
      if (!opts) {
        opts = {}
      }
      opts.hostname = url.hostname
      if (url.port) {
        opts.port = url.port
      }
      opts.path = url.path || '/'
      opts.method = method || 'GET'
    } catch (err) {
      reject(`解析请求选项异常, ${err}`)
      return
    }
    let sender = https
    if (url.protocol === 'http:') {
      sender = http
    }
    const req = sender.request(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
    })
    req.on('error', (err) => {
      reject(`请求异常, ${err}`)
      return
    })
    req.end()
  })
}


module.exports = {
  request,
}