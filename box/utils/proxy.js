const { app } = require('electron')
const xEngine = require('xfuture/index')
const xParser = require('xfuture/parser')
const xConfig = require('xfuture/config')
const { request: request_util } = require('./request')
const tcpping = require('tcp-ping')
const fs = require('fs')
const ini = require('ini')
const { staticPathJoin, userPathJoin } = require('./utils')
const { clog, cinfo, cerror, cwarning } = require('./color')
const { registeIPCHandle, sendIPC } = require('../ipc/main')

const getXFutureConfig = () => {
  let config = {
    resource_path: staticPathJoin('xfuture', 'resources'),
    password: '88991238',
    install_shell_path: '',
    install_helper_path: '',
    tun_config_path: '',
  }
  switch (process.platform) {
    case 'win32':
      config.install_shell_path = 'maodou'
      config.install_helper_path = staticPathJoin('xfuture', 'package', 'windows', 'sysproxy.exe')
      config.tun_config_path = staticPathJoin('xfuture', 'package', 'windows', 'sing-box-global.json')
      break
    case 'darwin':
      config.install_shell_path = staticPathJoin('xfuture', 'package', 'mac', 'install_helper.sh')
      config.install_helper_path = staticPathJoin('xfuture', 'package', 'mac', 'xfuture_helper')
      config.tun_config_path = ''
      break
  }
  return config
}

const proxy_ini_path = userPathJoin('proxy.ini')
cinfo('proxy', 'ini path:', proxy_ini_path)
const set_proxy_ini = (type, mode) => {
  try {
    fs.writeFileSync(proxy_ini_path, ini.stringify({
      type: type,
      mode: mode,
    }, {
      section: 'section',
    }))
  } catch (err) {
    cerror('proxy', 'set ini failed:', err)
  }
}
const get_proxy_ini = () => {
  let type = 'proxy'
  let mode = 'rule'
  if (fs.existsSync(proxy_ini_path)) {
    const config = ini.parse(fs.readFileSync(proxy_ini_path, 'utf-8'))
    if (config && 'section' in config && 'mode' in config.section) {
      mode = config.section.mode
    }
    if (config && 'section' in config && 'type' in config.section) {
      type = config.section.type
    }
  }
  return {
    type: type,
    mode: mode,
  }
}

const get_default_type = () => {
  return get_proxy_ini().type
}
const get_default_mode = () => {
  return get_proxy_ini().mode
}
const get_node_url_type = (url) => {
  const i = url.indexOf('://')
  if (i === -1) {
    return 'none'
  }
  return url.substr(0, i)
}

const xfuture_config = getXFutureConfig()
let xfuture = {
  allow: null,
  type: get_default_type(),
  mode: get_default_mode(),
  nodes: [],
  loaded: false,
  status: 'off',
  statusOnTime: null,
  node: null,
}
let fresh_delay_timer = null
const fresh_delay_duration = 10000

const SetProxyRouter = () => {
  get_proxy_routes().then(routes=>{
    cinfo('proxy', 'set router:', routes)
    xConfig.setRouterConfiguration(routes)
  }).catch(err=>{
    cerror('proxy', 'set router failed:', err)
  })
}

const get_proxy_routes = () => {
  return new Promise((resolve, reject) => {
    resolve([])
    return
  })
}

const initProxy = () => {
  try {
    SetProxyRouter()

    // TEST
    Close()
    app.on('before-quit', () => {
      Close()
    })
    process.on('SIGINT', () => {
      Close()
      process.exit(0)
    })
    registeIPCHandle('Proxy', (e, ...args) => {
      return xfuture
    })
    registeIPCHandle('ProxyReload', (e, ...args) => {
      return Reload(...args)
    })
    registeIPCHandle('ProxyConfigNodesBySubURL', (e, ...args) => {
      return ConfigNodesBySubURL(...args)
    })
    registeIPCHandle('ProxyConfigNodesByNodeURLs', (e, ...args) => {
      return ConfigNodesByNodeURLs(...args)
    })
    registeIPCHandle('ProxyConfigNodesByNodeURLMetas', (e, ...args) => {
      return ConfigNodesByNodeURLMetas(...args)
    })
    registeIPCHandle('ProxyConfigAllow', (e, ...args) => {
      return ConfigAllow(...args)
    })
    registeIPCHandle('ProxyRefreshNodeDelay', (e, ...args) => {
      return RefreshNodeDelay(...args)
    })
    registeIPCHandle('ProxyStart', (e, ...args) => {
      return Start(...args)
    })
    registeIPCHandle('ProxyChangeType', (e, ...args) => {
      return ChangeType(...args)
    })
    registeIPCHandle('ProxyChangeMode', (e, ...args) => {
      return ChangeMode(...args)
    })
    registeIPCHandle('ProxyChangeNode', (e, ...args) => {
      return ChangeNode(...args)
    })
    registeIPCHandle('ProxyClose', (e, ...args) => {
      return Close(...args)
    })
  } catch(err) {
    cerror('proxy', 'config xfuture failed:', err)
  }
}

// reload
const Reload = () => {
  Close().catch(err => {
    cerror('proxy', 'reload failed:', err)
  })
  xfuture = {
    allow: null,
    type: get_default_type(),
    mode: get_default_mode(),
    nodes: [],
    loaded: false,
    status: 'off',
    statusOnTime: null,
    node: null,
  }
  changeXFutureDo()
}

// nodes
const ConfigNodesBySubURL = (subURL) => {
  return new Promise((resolve, reject) => {
    request_util({url: subURL}).then((data)=>{
      // clog('proxy', `subURL: ${subURL}`)
      let nodeURLs = []
      try {
        data = Buffer.from(data, 'base64')
        for (let nodeURL of data.toString('utf8').split('\n')) {
          nodeURL = nodeURL.trim().replace('\r', '')
          if (nodeURL) {
            nodeURLs.push(nodeURL)
          }
        }
      } catch (err) {
        reject(`解析订阅链接内容失败, ${err}`)
        return
      }
      // clog('proxy', `nodeURLs: ${nodeURLs}`)
      ConfigNodesByNodeURLs(nodeURLs).then(() => {
        resolve()
        return
      }).catch(err => {
        reject(err)
        return
      })
    }).catch(err=>{
      reject(err)
      return
    })
  })
}
const ConfigNodesByNodeURLs = (nodeURLs) => {
  return new Promise((resolve, reject) => {
    let nodesTmp = []
    try {
      for (let nodeURL of nodeURLs) {
        if (!nodeURL) {
          continue
        }
        let node = xParser.parse(nodeURL)
        nodesTmp.push({
          name: decodeURI(node.remark),
          type: get_node_url_type(nodeURL),
          server: node.address,
          port: node.port,
          url: nodeURL,
          delay: null,
        })
      }
    } catch (err) {
      reject(`解析节点链接失败, ${err}`)
      return
    }
    ConfigNodes(nodesTmp).then(() => {
      resolve()
      return
    }).catch(err => {
      reject(err)
      return
    })
  })
}
const ConfigNodesByNodeURLMetas = (nodeURLMetas) => {
  return new Promise((resolve, reject) => {
    let nodesTmp = []
    try {
      for (let nodeURLMeta of nodeURLMetas) {
        if (!nodeURLMeta || !nodeURLMeta.url) {
          continue
        }
        let node = xParser.parse(nodeURLMeta.url)
        nodesTmp.push({
          name: decodeURI(node.remark),
          type: get_node_url_type(nodeURLMeta.url),
          server: node.address,
          port: node.port,
          url: nodeURLMeta.url,
          delay: null,
          allows: nodeURLMeta.allows || [],
          meta: nodeURLMeta.meta,
        })
      }
    } catch (err) {
      reject(`解析节点链接失败, ${err}`)
      return
    }
    ConfigNodes(nodesTmp).then(() => {
      resolve()
      return
    }).catch(err => {
      reject(err)
      return
    })
  })
}
const ConfigNodes = (nodesTmp) => {
  return new Promise((resolve, reject) => {
    Close().then(async () => {
      xfuture.nodes = nodesTmp
      xfuture.loaded = true
      let node = null
      node = await pick_node(null).catch(err=>{
        node = null
      })
      xfuture.node = node
      fresh_node_delay()
      changeXFutureDo()
      resolve()
      return
    }).catch(err => {
      reject(err)
      return
    })
  })
}
const ConfigAllow = (allow) => {
  return new Promise((resolve, reject) => {
    xfuture.allow = allow
    ChangeNode(null).catch(err=>{
      cwarning('proxy', 'config allow after change node failed:', err)
    })
    resolve()
  })
}

// delay
const RefreshNodeDelay = () => {
  for (let index in xfuture.nodes) {
    xfuture.nodes[index].delay = null
  }
  fresh_node_delay()
}
const fresh_node_delay = () => {
  if (fresh_delay_timer) {
    clearInterval(fresh_delay_timer)
  }
  fresh_node_delay_do()
  fresh_delay_timer = setInterval(()=>{
    fresh_node_delay_do()
  }, fresh_delay_duration)
}
const fresh_node_delay_do = () => {
  try {
    for (let index in xfuture.nodes) {
      let node = xfuture.nodes[index]
      if (node.delay) {
        continue
      }
      tcpping.ping({
        address: node.server,
        port: node.port,
      }, (err, data) => {
        if (!err) {
          let delay = parse_delay(data)
          if (delay) {
            if (xfuture.nodes[index]) {
              xfuture.nodes[index].delay = delay
            }
          }
        }
      })
    }
  } catch (err) {
    cerror('proxy', 'fresh node delay failed:', err)
  }
}
const parse_delay = (data) => {
  if (!data) {
    return null
  }
  const effective_delay = (s) => {
    let n = parseFloat(s)
    if (n.toString() === 'NaN') {
      return null
    }
    return n
  }
  let fields = ['avg', 'min', 'max']
  for (let field of fields) {
    if (field in data) {
      let delay = effective_delay(data[field])
      if (delay) {
        return delay
      }
    }
  }
  return null
}

// operate
const Start = (type, mode, name) => {
  return new Promise(async (resolve, reject) => {
    if (type !== 'proxy' && type !== 'tun') {
      type = xfuture.type
    }
    if (mode !== 'rule' && mode !== 'global') {
      mode = xfuture.mode
    }
    // let node = null
    let node = await pick_node(name).catch(err=>{
      reject(err)
      return
    })
    if (!node) {
      reject(`无匹配节点`)
      return
    }
    let statusOnTime = Date.now()
    if (xfuture.status === 'on') {
      statusOnTime = xfuture.statusOnTime
    }
    // cinfo('proxy', 'start:', `type(${type}), mode(${mode}), node(${node.name}), node url(${node.url})`)
    try {
      // stop tunnel
      xEngine.StopTunnel()
      // handle type
      let typeEnabled = false
      switch (type) {
        case 'proxy':
          typeEnabled = false
          break
        case 'tun':
          typeEnabled = true
          break
        default:
          reject(`无效的代理模式`)
          return
      }
      xEngine.SetTunModeEnable(typeEnabled, xfuture_config.resource_path, xfuture_config.tun_config_path)
      // handle mode
      let modeEnabled = false
      switch (mode) {
        case 'rule':
          modeEnabled = false
          break
        case 'global':
          modeEnabled = true
          break
        default:
          reject(`无效的代理类型`)
          return
      }
      xEngine.SetGlobalMode(modeEnabled, xfuture_config.resource_path)
      // handle tunnel
      if (!xEngine.StartTunnel(node.url)) {
        reject(`开启代理失败`)
        return
      }
      xfuture.type = type
      xfuture.mode = mode
      xfuture.node = node
      xfuture.status = 'on'
      xfuture.statusOnTime = statusOnTime
      changeXFutureDo()
      resolve()
      return
    } catch (err) {
      reject(`开启代理失败: ${err}`)
      return
    }
  })
}
const ChangeType = (type) => {
  return new Promise((resolve, reject) => {
    if (type !== 'proxy' && type !== 'tun') {
      reject(`无效的代理模式`)
      return
    }
    if (xfuture.status === 'on') {
      Start(type, null, null).then(()=>{
        resolve()
        return
      }).catch(err=>{
        reject(err)
        return
      })
    } else {
      xfuture.type = type
      changeXFutureDo()
      resolve()
      return
    }
  })
}
const ChangeMode = (mode) => {
  return new Promise((resolve, reject) => {
    if (mode !== 'rule' && mode !== 'global') {
      reject(`无效的代理类型`)
      return
    }
    if (xfuture.status === 'on') {
      Start(null, mode, null).then(()=>{
        resolve()
        return
      }).catch(err=>{
        reject(err)
        return
      })
    } else {
      xfuture.mode = mode
      changeXFutureDo()
      resolve()
      return
    }
  })
}
const ChangeNode = (name) => {
  return new Promise(async (resolve, reject) => {
    let node = await pick_node(name).catch(err=>{
      reject(err)
      return
    })
    console.log(node)
    if (!node) {
      reject(`无匹配节点`)
      return
    }
    if (xfuture.status === 'on') {
      Start(null, null, name).then(()=>{
        resolve()
        return
      }).catch(err=>{
        reject(err)
        return
      })
    } else {
      xfuture.node = node
      changeXFutureDo()
      resolve()
      return
    }
  })
}
const Close = () => {
  return new Promise((resolve, reject) => {
    try {
      xEngine.StopTunnel()
      xEngine.SetTunModeEnable(false, xfuture_config.resource_path, xfuture_config.tun_config_path)
      xfuture.status = 'off'
      xfuture.statusOnTime = null
      changeXFutureDo()
      resolve()
      return
    } catch (err) {
      reject(`关闭代理失败, ${err}`)
      return
    }
  })
}

const changeXFutureDo = () => {
  set_proxy_ini(xfuture.type, xfuture.mode)
  switch (xfuture.status) {
    case 'on':
      startXFutureDo()
      break
    case 'off':
      closeXFutureDo()
      break
  }
  sendIPC('ProxyListen', xfuture)
}

let speed_timer = null
const startXFutureDo = () => {
  closeXFutureDo()
  speed_timer = setInterval(()=>{
    let down = 0, up = 0
    try {
      const {downloadlink, uploadlink} = xEngine.GetStatistics()
      down = downloadlink
      up = uploadlink
    } catch (err) {
      cwarning('proxy', 'Speed test failed:', err)
    }
    sendIPC('ProxySpeedListen', { down: down, up: up })
  }, 1000)
}
const closeXFutureDo = () => {
  if (speed_timer) {
    clearInterval(speed_timer)
    speed_timer = null
  }
  sendIPC('ProxySpeedListen', { down: 0, up: 0 })
}

const pick_node = (name) => {
  return new Promise((resolve, reject) => {
    const name_is_empty = !name
    let current_node = null
    let contain_name = false
    let name_node = null
    let allow_nodes = []
    for (let node of xfuture.nodes) {
      const allow = !node.allows || node.allows.length === 0 || node.allows.includes(xfuture.allow)

      if (xfuture.node && node.name === xfuture.node.name) {
        current_node = node
      }

      if (node.name === name) {
        contain_name = true
        if (allow) {
          name_node = node
        }
      }

      if (allow) {
        allow_nodes.push(node)
      }
    }

    if (!name_is_empty) {
      if (!contain_name) {
        reject(`节点不存在`)
        return
      }
      if (!name_node) {
        reject(`节点无权使用`)
        return
      }
      resolve(name_node)
      return
    }

    if (current_node) {
      resolve(current_node)
      return
    }

    allow_nodes.sort((a, b) => {
      if (a.delay != b.delay) {
        return a.delay - b.delay
      }
      return 0
    })
    if (allow_nodes.length > 0) {
      resolve(allow_nodes[0])
      return
    }

    reject(`无可用节点`)
    return
  })
}

module.exports = {
  initProxy,
  getXFutureConfig,
  Close,
}