<template>
  <v-card>
    <v-card-title>
      检查更新
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog" text color="primary">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div v-if="!checked">
        <v-progress-circular
          class="text-center"
          :size="50"
          :width="4"
          color="primary"
          indeterminate
        ></v-progress-circular>
        <span style="margin-left: 20px;">检查更新中...</span>
      </div>
      <div v-else-if="updateInfo.version!=appVersion">
        <div style="color: black; font-size: 16px;">
          <v-icon color="success" size="30">mdi-check</v-icon>
          发现新版本
        </div>
        <div>新版本：{{updateInfo.version}}</div>
        <div>更新内容：{{updateInfo.msg}}</div>
        <div>发行时间：{{updateInfo.time}}</div>
      </div>
      <div v-else>
        <div style="color: black; font-size: 16px;">
          <v-icon color="success" size="30">mdi-check</v-icon>
          已是最新版本
        </div>
      </div>
    </v-card-text>
    <v-card-actions v-if="updateInfo.version!=appVersion">
      <v-btn text color="primary" @click="doUpdate">更新</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import moment from 'moment'
import { callExe, getAppVersion } from '../utils/tools'
import { Confirm } from '../utils/dialog'
export default {
  name: 'CheckUpdate',
  data () {
    return {
      updateInfo: null,
      server: Window.$WebSocket,
      checked: false
    }
  },
  computed: {
    appVersion () {
      return getAppVersion()
    }
  },
  methods: {
    closeDialog () {
      this.$emit('onDialogClose')
    },
    checkUpdate () {
      const version = getAppVersion()
      this.server.On('Update', data => {
        if (data.code === 200) {
          this.checked = true
          if (data.data) {
            this.updateInfo = data.data
            this.updateInfo.time = moment(data.data.time).format('YYYY-MM-DD HH:mm:ss')
            console.log(this.updateInfo)
          } else {
            this.snackbar.Success('检查更新完成')
          }
        } else {
          this.closeDialog()
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Update', { version })
    },
    doUpdate () {
      Confirm('确认要更新吗，点击确定后将关闭程序', '关闭提醒').then(data => {
        if (data) {
          callExe(`-url ${this.updateInfo.url}`)
        }
      })
    }
  },
  mounted () {
    this.checkUpdate()
  }
}
</script>

<style>

</style>
