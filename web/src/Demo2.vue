<script setup>
import { Select } from '@element-plus/icons-vue'
import { ref } from 'vue'

window.api.Proxy().then(data=>{
  if (!data.loaded) {
    window.api.ProxyChangeType('proxy').catch(err=>{
      console.error(err)
    })
    window.api.ProxyConfigNodesByNodeURLs([
      "vless://d4eea418-4efd-4544-b8a2-1db4f9e8eb57@103.148.73.239:443?type=ws&encryption=none&security=tls&sni=hk08.mddpnd2587.xyz&path=/81574b6b-c9d7-44a0-b83d-dad56e8cb527&host=hk08.mddpnd2587.xyz&fp=chrome#%F0%9F%87%AD%F0%9F%87%B0%E9%A6%99%E6%B8%AFZ08%7C%E5%A5%88%E9%A3%9E",
      "vless://d4eea418-4efd-4544-b8a2-1db4f9e8eb57@103.140.136.208:443?type=ws&encryption=none&security=tls&sni=jp03.mddpnd3687.xyz&path=/269b42af-284b-439c-9d82-dd8f3e2d8d33&host=jp03.mddpnd3687.xyz&fp=chrome#%F0%9F%87%AF%F0%9F%87%B5%E6%97%A5%E6%9C%ACZ13%7C%E5%A5%88%E9%A3%9E%7CGPT",
    ]).catch(err=>{
      alert(err)
    })
  }
}).catch(err=>{
  console.error(err)
})

const url_type = ref('sub_url')
const url = ref('')
const info = ref({})

const loadURL = () => {
  if (!url.value) {
    alert('请输入URL')
    return
  }
  switch (url_type.value) {
    case 'sub_url':
      window.api.ProxyConfigNodesBySubURL(url.value).then(()=>{
        url.value = ''
      }).catch(err=>{
        alert(err)
      })
      break
    case 'node_url':
      window.api.ProxyConfigNodesByNodeURLs([url.value]).then(()=>{
        url.value = ''
      }).catch(err=>{
        alert(err)
      })
      break
    default:
      alert('无效的URL类型')
      return
  }
}

const selectNode = (row) => {
  console.log(row.name)
  window.api.ProxyStart(null, null, row.name).catch(err=>{
    alert(err)
  })
}
const close = () => {
  window.api.ProxyClose().catch(err=>{
    alert(err)
  })
}
const loadInfo = ()=>{
  window.api.Proxy().then((resp)=>{
    info.value = resp
  }).catch(err=>{
    alert('info err:'+err)
  })
}
const listenInfo = ()=>{
  window.api.ProxyListen((resp)=>{
    console.log("listen info:", resp)
    info.value = resp
  })
}
const isStartedNode = (node) => {
  if (info.value.status !== 'on') {
    return false
  }
  if (info.value && info.value.node && info.value.node.name) {
    console.log(info.value.node.name === node.name)
    return info.value.node.name === node.name
  }
  return false
}
const changeMode = (mode) => {
  window.api.ProxyChangeMode(mode).catch(err=>{
    alert(err)
  })
}


const formatterDelay = (row, column) => {
  const delay = parseFloat(row.delay)
  if (delay) {
    return delay.toFixed(2)+'ms'
  }
  return '-'
}

loadInfo()
listenInfo()
setInterval(()=>{
  console.log("123123")
  loadInfo()
}, 2000)
</script>

<template>
  <div class="page">
    <div class="header">
      <el-button :type="info.mode == 'rule' ? 'primary' : ''" @click="changeMode('rule')">局部代理</el-button>
      <el-button :type="info.mode == 'global' ? 'primary' : ''" @click="changeMode('global')">全局代理</el-button>
    </div>
    <div class="content">
      <el-table :data="info.nodes" empty-text="无节点" height="100%" fit>
        <el-table-column prop="name" label="节点名称"/>
        <el-table-column prop="delay" :formatter="formatterDelay" label="节点延迟"/>
        <el-table-column align="right">
          <template #header>
            <!-- <el-button size="small" type="primary" @click="loadInfo">刷新</el-button> -->
            <el-button size="small" type="danger" v-if="info.status === 'on'" @click="close">关闭代理</el-button>
          </template>
          <template #default="scope">
            <el-text v-if="info.status === 'on' && info.node && scope.row.name === info.node.name">使用中</el-text>
            <el-button size="small" type="primary" v-if="info.status === 'off' || (info.node && scope.row.name !== info.node.name)" @click="selectNode(scope.row)">使用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
#app {
  padding: 0;
}
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.page .header {
  box-sizing: border-box;
  padding: 0.5rem;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 4rem;
  z-index: 999;
  background: #FFF;
}
.page .content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin-top: 4rem;
}
</style>
