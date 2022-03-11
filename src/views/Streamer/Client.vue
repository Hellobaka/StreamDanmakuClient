<template>
  <div style="display: flex;height:100%;" @mousemove="toolbarActiveChange" data-app="true">
    <div id="videoContainer" @contextmenu="showMenu">
      <div id="logs" v-if="showLogs">
        <p v-for="log in logs" :key="log.time">{{log.content}}</p>
      </div>
      <video autoplay ref="videoMain" muted></video>
      <v-menu v-model="menu" :position-x="menuX" :position-y="menuY" absolute offset-y>
        <v-list dark style="background-color: rgba(100,100,100,.2);" ref="menuList">
          <v-list-item @click="playStatusChange">{{playStatus?'暂停': '播放'}}</v-list-item>
          <v-list-item @click="volClick">{{vols?'':'取消'}}静音</v-list-item>
          <v-list-item @click="clickHandle">视频统计信息</v-list-item>
          <v-list-item @click="showLogs=!showLogs">播放器日志</v-list-item>
        </v-list>
      </v-menu>
      <div id="progressCircle" v-if="loading">
        <v-progress-circular
          indeterminate
          size="64"
          style="color: white;"
        ></v-progress-circular>
      </div>
      <div id="videoToolBar" v-bind:class="{'toolbarInactive': !toolbarActive}">
        <v-tooltip top color="rgba(100,100,100,.5)">
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon @click="playStatusChange"><v-icon>{{playButtonIcon}}</v-icon></v-btn>
          </template>
          <span>{{playStatus?'暂停': '播放'}}</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon @click="reconnect"><v-icon>mdi-refresh</v-icon></v-btn>
          </template>
          <span>重新连接</span>
        </v-tooltip>
        <v-hover v-slot="{ hover }">
          <div id="volControl">
            <v-btn icon @click="volClick">
              <v-icon>{{volIcon}}</v-icon>
            </v-btn>
            <v-fade-transition>
              <div v-if="hover" id="volControlBox">
                  <v-slider @input="volChange" height="150px" vertical thumb-label v-model="vols" id="volController" :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
              </div>
            </v-fade-transition>
          </div>
        </v-hover>
        <v-spacer></v-spacer>
        <div id="danmakuSender">
          <input v-model="currentDanmaku" @keydown.enter="sendDanmaku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmakuSender">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="sendDanmaku" v-on="on" v-bind="attrs" :color="danmakuSenderColor" style="color: white;">{{danmakuSenderText}}</v-btn>
            </template>
            <span>发送弹幕</span>
          </v-tooltip>
        </div>
        <v-spacer></v-spacer>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="showDanmakuChange" v-on="on" v-bind="attrs" icon><v-icon>{{danmakuSwitchIcon}}</v-icon></v-btn>
          </template>
          <span>{{showDanmaku?'关闭':'打开'}}弹幕</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon><v-icon>mdi-message-cog-outline</v-icon></v-btn>
          </template>
          <span>弹幕设置</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon><v-icon>mdi-overscan</v-icon></v-btn>
          </template>
          <span>拉伸</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon @click="callScreenFull"><v-icon>mdi-fullscreen</v-icon></v-btn>
          </template>
          <span>全屏</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import { loadLocalConfig, writeLocalConfig } from '../../utils/tools'
import moment from 'moment'
import { Info } from '../../utils/dialog'

export default {
  data () {
    return {
      server: Window.$WebSocket,
      screenFullFlag: false,
      thisWindow: null,
      preVol: 100,
      vols: 100,
      playStatus: true,
      loading: true,
      toolbarActive: false,
      currentDanmaku: '',
      showDanmaku: true,
      danmakuInputFlag: false,
      activeChangeCounter: 0,
      danmakuCD: 0,
      danmakuCDTimer: 0,
      menu: false,
      menuX: 0,
      menuY: 0,
      logs: [],
      showLogs: false,
      remoteVideo: new MediaStream(),
      RTCConnection: new RTCPeerConnection(),
      RTCConfigure: {
        iceServers:
        [
          {
            urls: 'stun:stun.hellobaka.xyz'
          },
          {
            urls: 'turn:turn.hellobaka.xyz',
            username: 'aaaaaa',
            credential: 'bbbbbb'
          }
        ]
      }
    }
  },
  computed: {
    volIcon: function () {
      if (this.vols === 0) return 'mdi-volume-mute'
      else if (this.vols < 50) return 'mdi-volume-medium'
      else return 'mdi-volume-high'
    },
    danmakuSenderText: function () {
      if (this.danmakuCD !== 0) return `${this.danmakuCD}秒`
      return '发送'
    },
    danmakuSenderColor: function () {
      if (this.danmakuCD !== 0) return '#a9a9a9'
      return this.$vuetify.theme.themes.light.primary
    },
    danmakuSwitchIcon: function () {
      return this.showDanmaku ? 'mdi-message-processing-outline' : 'mdi-message-off-outline'
    },
    playButtonIcon: function () {
      return this.playStatus ? 'mdi-origin' : 'mdi-steam'
    },
    config: function () {
      return loadLocalConfig('Config')
    }
  },
  mounted () {
    this.server.TempGetInfoCallback = (data) => {
      this.thisWindow = require('@electron/remote').getCurrentWindow()
      this.server.On('RoomEntered', this.handleRoomEnter)
      this.server.On('RoomVanish', this.handleRoomVanish)
      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    }
    const timeout = 1500
    setInterval(() => {
      if (!this.toolbarActive || this.danmakuInputFlag) return
      this.activeChangeCounter++
      if (this.activeChangeCounter === timeout) {
        this.toolbarActive = false
      }
    }, 100)
    this.$refs.videoMain.srcObject = this.remoteVideo
    this.$refs.videoMain.srcObject.onactive = () => {
      this.loading = false
    }
    this.$refs.videoMain.srcObject.oninactive = () => {
      this.loading = true
    }

    if (this.config.stunServer) this.RTCConfigure.iceServers[0].urls = this.config.stunServer
    if (this.config.turnServer) {
      const result = /turn:(.*?)\[(.*?):(.*?)\]/.exec()
      const serverLength = this.RTCConfigure.iceServers.length - 1
      if (result.length === 3) {
        this.RTCConfigure.iceServers[serverLength].urls = `turn:${result[0].trim()}`
        this.RTCConfigure.iceServers[serverLength].credential = result[1]
        this.RTCConfigure.iceServers[serverLength].urls = result[2]
      }
    }
    this.showDanmaku = !!this.config.danmakuDefault
    this.RTCConnection = new RTCPeerConnection(this.RTCConfigure)
    this.writeLog('已新建RTC连接, 等待服务器响应')
  },
  methods: {
    callScreenFull () {
      if (!this.screenFullFlag) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
      this.screenFullFlag = !this.screenFullFlag
    },
    volClick () {
      if (this.vols !== 0) {
        this.preVol = this.vols
        this.vols = 0
      } else {
        this.vols = this.preVol
      }
      this.volChange()
    },
    inputOnFocus () {
      this.danmakuInputFlag = true
      this.$refs.danmakuSender.style.boxShadow = `0px 0px 20px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    inputOnBlur () {
      this.danmakuInputFlag = false
      this.$refs.danmakuSender.style.boxShadow = `0px 0px 0px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    toolbarActiveChange () {
      this.toolbarActive = true
      this.activeChangeCounter = 0
    },
    reconnect () {
      this.server.Emit('Leave', {})
      this.remoteVideo.getTracks().forEach(x => this.remoteVideo.removeTrack(x))
      this.RTCConnection.close()
      this.RTCConnection.ontrack = null
      this.RTCConnection.onicecandidate = null
      this.writeLog('主动放弃连接成功，开始重新请求连接')

      this.RTCConnection = new RTCPeerConnection(this.RTCConfigure)
      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    },
    showMenu (e) {
      e.preventDefault()
      this.menu = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.$nextTick(() => {
        this.menu = true
      })
    },
    clickHandle () {},
    playStatusChange () {
      if (this.playStatus) {
        this.playStatus = false
        this.$refs.videoMain.pause()
      } else {
        this.playStatus = true
        this.$refs.videoMain.play()
      }
    },
    writeLog (log) {
      if (!log) return
      this.logs.push({ content: `[${moment().format('yyyy-MM-DD HH:mm:ss')}] ${log}`, time: new Date().getTime() })
    },
    sendDanmaku () {
      if (this.danmakuCD) return
      if (this.danmakuCDTimer) {
        clearInterval(this.danmakuCDTimer)
      }
      this.danmakuCD = 1
      this.danmakuCDTimer = setInterval(() => {
        if (this.danmakuCD === 0) return
        this.danmakuCD--
      }, 1000)
      this.writeLog(this.currentDanmaku)
      this.currentDanmaku = ''
    },
    showDanmakuChange () {
      this.showDanmaku = !this.showDanmaku
      if (this.config.danmakuRemember) {
        writeLocalConfig('Config', 'danmakuDefault', this.showDanmaku)
      }
    },
    async handleRoomEnter (data) {
      if (data.code !== 200) {
        this.snackbar.Error(data.msg)
      } else {
        this.writeLog('初始化RTC连接...')
        this.RTCConnection.addTransceiver('audio', { direction: 'recvonly' })
        this.RTCConnection.addTransceiver('video', { direction: 'recvonly' })
        this.RTCConnection.onicecandidate = (e) => {
          this.writeLog('收到远程方令牌')
          if (e.candidate) {
            this.server.Emit('Candidate', { candidate: e.candidate })
          }
        }

        this.RTCConnection.ontrack = (e) => {
          this.writeLog('接收到音视频轨道')
          this.remoteVideo.addTrack(e.track)
        }
        this.server.On('Offer', this.OnOffer)
        this.server.On('Candidate', this.OnCandidate)
        this.writeLog('向远程方发送连接请求...')
        this.server.Emit('Offer', { offer: 'plz' })
      }
    },
    handleRoomVanish () {
      console.log('Receive room exit')
      Info('与房主断开连接，点击确定返回房间列表', '连接中断').then(() => {
        this.thisWindow.close()
      })
    },
    async OnOffer (data) {
      console.log('offer ', data)
      this.writeLog('收到远程方连接响应')
      await this.RTCConnection.setRemoteDescription(data.data)
      const answer = await this.RTCConnection.createAnswer()
      await this.RTCConnection.setLocalDescription(answer)
      this.writeLog('向远程方发送连接响应')
      this.server.Emit('Answer', { answer })
    },
    async OnCandidate (data) {
      console.log('candidate ', data)
      await this.RTCConnection.addIceCandidate(new RTCIceCandidate(data.data))
    },
    volChange () {
      this.$refs.videoMain.volume = this.vols / 100
    }
  },
  beforeDestroy () {
    this.server.Emit('Leave', {})
    this.RTCConnection.close()
    this.RTCConnection.onicecandidate = null
    this.RTCConnection.ontrack = null
  }
}
</script>

<style scoped>
#danmakuSender {
  display: flex;
  width: 50%;
}
.normalInput {
  width: 100%;
  color: white;
  padding: 0 5px;
  background-color: rgba(100,100,100,.5);
  border-radius: 5px;
  outline: none;
  border: 0;
  transition: .2s all linear;
}
#logs {
  position: absolute;
  margin-left: 10px;
  /* margin-top: 10px; */
  bottom: 50px;
  max-height: 150px;
  border-radius: 10px;
  overflow: auto;
  overflow-x: hidden;
  text-overflow: ellipsis;
  width: 40%;
  min-width: 150px;
  color: lightgray;
  z-index: 10;
  transition: .2s all linear;
  /* background: rgba(100,100,100,.5); */
}
#logs::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
#logs::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : #535353;
}
#logs::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
}
.spacer {
  height: 100%;
}
.v-icon{
  color: white !important;
}
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
#videoContainer{
  background-color: black;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
#videoToolBar{
  padding: 0 10px;
  width: 100%;
  position: absolute;
  bottom: 0;
  display: flex;
  margin-bottom: 5px;
  transition: .2s all linear;
}
#progressCircle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background-color: rgba(100,100,100,.5);
  padding: 10px;
  border-radius: 10px;
}
#volControl {
  position: relative;
}
#volControlBox{
  position: absolute;
  left: 50%;
  width: 30px;
  height: 160px;
  padding: 5px;
  /* background: rgba(100,100,100,.5); */
  transform: translate(-50%, -130%);
}
.v-slider--vertical{
  min-height: 40px !important;
}
.toolbarInactive {
  opacity: 0;
}
</style>
