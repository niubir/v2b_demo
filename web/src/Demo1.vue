<script setup>
import { Select } from '@element-plus/icons-vue'
import { ref } from 'vue'

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
  console.log('node:',node)
  console.log('info.value:',info.value)
  if (info.value.status !== 'on') {
    return false
  }
  if (info.value && info.value.node && info.value.node.name) {
    console.log(info.value.node.name === node.name)
    return info.value.node.name === node.name
  }
  return false
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
</script>

<template>
  <div class="page">
    <div class="header">
      <el-input
        v-model="url"
        placeholder="输入URL"
        class="input-with-select"
      >
        <template #prepend>
          <el-select v-model="url_type" type="primary" placeholder="选择URL类型" style="width: 7rem">
            <el-option label="订阅链接" value="sub_url" />
            <el-option label="节点链接" value="node_url" />
          </el-select>
        </template>
        <template #append>
          <el-button type="success" :icon="Select" @click="loadURL" >确认</el-button>
        </template>
      </el-input>
    </div>
    <div class="content">
      <el-table :data="info.nodes" empty-text="无节点" height="100%" fit>
        <el-table-column prop="name" label="节点名称"/>
        <el-table-column prop="delay" :formatter="formatterDelay" label="节点延迟"/>
        <el-table-column align="right">
          <template #header>
            <el-button size="small" type="primary" @click="loadInfo">刷新</el-button>
            <el-button size="small" type="danger" v-if="info.status === 'on'" @click="close">关闭代理</el-button>
          </template>
          <template #default="scope">
            <el-text v-if="info.status === 'on' && info.node && scope.row.name === info.node.name">已开启</el-text>
            <el-button size="small" type="primary" v-if="info.status === 'off' || (info.node && scope.row.name !== info.node.name)" @click="selectNode(scope.row)">开启代理</el-button>
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
  height: 2rem;
  z-index: 999;
  background: #FFF;
}
.page .content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin-top: 2rem;
}
</style>
