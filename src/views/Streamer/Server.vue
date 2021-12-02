<template>
  <v-app id="frameMain">
    <v-app-bar app dense class="draggable" id="toolBar" ref="header">
      <span style="font-size: 15px;">房间: {{10}} - {{onlineCount}}人在线 延时: {{serverDelay}} ms
        <div :style="`margin-left: 10px;float:right;width: 20px; height: 20px; border: 1px solid white; border-radius: 50%; background-color: ${serverConnected?'green':'coral'}`"></div>
      </span>
      <v-spacer></v-spacer>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="setTransplant" icon @click="setIgnoreMouse" v-bind="attrs" v-on="on" v-bind:style="ignoreMouse?'background:rgba(255,255,255,.2)':''"><v-icon>mdi-lock</v-icon></v-btn>
        </template>
        <span>窗口穿透</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="setTop" icon @click="setTopMost" v-bind="attrs" v-on="on" v-bind:style="topMost?'background:rgba(255,255,255,.2)':''"><v-icon>mdi-dock-top</v-icon></v-btn>
        </template>
        <span>窗口置顶</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="minimizeWindow"><v-icon>mdi-arrow-down</v-icon></v-btn>
        </template>
        <span>最小化</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="closeWindow"><v-icon>mdi-close</v-icon></v-btn>
        </template>
        <span>关闭</span>
      </v-tooltip>
    </v-app-bar>
    <v-main class="halfTransplant">
      <v-list :style="`background: transparent;overflow-y: scroll;height:${listHeight}px;`" id="danmukuList">
        <v-list-item v-for="item in danmukuList" :key="item.time" dense>
          <span v-if="item.log" style="color:skyblue">
            [{{timeFormat(item.time)}}]
          </span>
          {{item.content}}
        </v-list-item>
      </v-list>
    </v-main>
    <v-footer ref="footer" style="display:flex; padding:10px;" class="halfTransplant" elevation="10">
      <span style="margin-right: 10px;">弹幕: {{danmukuCount}}条</span>
      <span style="margin-right: 10px;">网络上行: {{networkUpload}} KB/s</span>
      <span>码率: {{bitRate}} KB/s</span>
      <v-spacer></v-spacer>
      <v-btn>推流预览</v-btn>
    </v-footer>
  </v-app>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { screen, Tray, Menu } from '@electron/remote'
import { loadLocalConfig, writeSessionStorage } from '../../utils/tools'
import { Confirm } from '../../utils/dialog'
import moment from 'moment'
const { SDPTools } = require('../../utils/sdp_tools')

export default {
  data () {
    return {
      onlineCount: 0,
      thisWindow: null,
      topMost: false,
      ignoreMouse: false,
      serverDelay: 0,
      serverConnected: false,
      danmukuList: [],
      networkUpload: 0,
      bitRate: 0,
      server: Window.$WebSocket,
      tray: null,
      listHeight: 496,
      headerHeight: 0,
      footerHeight: 0,
      stateHandler: 0,
      remoteVideo: new MediaStream(),
      RTCConnectionList: new Map(),
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
    config: function () {
      return loadLocalConfig('Config')
    },
    danmukuCount: function () {
      return this.danmukuList.filter(x => !x.log).length
    }
  },
  beforeCreate () {
    writeSessionStorage('StreamFlag', true)
  },
  beforeDestroy () {
    if (this.tray) this.tray.destroy()
    if (this.remoteVideo) this.remoteVideo.getTracks().forEach(x => x.stop())
    this.RTCConnectionList.forEach(x => {
      x.close()
      x.onicecandidate = null
      x.ontrack = null
    })
  },
  mounted () {
    this.$vuetify.theme.dark = true
    this.thisWindow = require('@electron/remote').getCurrentWindow()
    this.init()
    this.$refs.setTop.$el.onmouseleave = () => {
      if (this.ignoreMouse) this.thisWindow.setIgnoreMouseEvents(true, { forward: true })
    }
    this.$refs.setTop.$el.onmouseenter = () => {
      this.thisWindow.setIgnoreMouseEvents(false)
    }
    this.$refs.setTransplant.$el.onmouseleave = this.$refs.setTop.$el.onmouseleave
    this.$refs.setTransplant.$el.onmouseenter = this.$refs.setTop.$el.onmouseenter

    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
    // this.tray = new Tray('src/public/main.ico')

    // this.updateMenu()
  },
  methods: {
    timeFormat (time) {
      return moment(time).format('yyyy-MM-DD HH:mm:ss')
    },
    writeLog (content) {
      this.danmukuList.push({ content: `${content}`, time: new Date().getTime(), log: true })
    },
    updateMenu () {
      this.tray.setToolTip('vue-cli-electron')
      this.tray.setContextMenu(this.genMenuByTemplate())
    },
    genMenuByTemplate () {
      return Menu.buildFromTemplate([
        {
          label: '窗口穿透',
          type: 'checkbox',
          click: () => {
            this.setIgnoreMouse()
          },
          checked: this.ignoreMouse
        },
        {
          label: '窗口置顶',
          type: 'checkbox',
          click: () => {
            this.setTopMost()
          },
          checked: this.topMost
        },
        {
          label: '最小化',
          click: () => {
            this.minimizeWindow()
          }
        },
        {
          type: 'separator'
        },
        {
          label: '退出推流',
          click: () => {
            this.closeWindow()
          }
        }
      ])
    },
    async init () {
      setInterval(() => {
        this.serverConnected = this.server.connection.readyState === 1
        this.serverDelay = this.serverConnected ? this.server.delay : '∞'
      }, 100)
      const winW = screen.getPrimaryDisplay().workAreaSize.width
      const winH = screen.getPrimaryDisplay().workAreaSize.height
      this.thisWindow.setPosition(parseInt(winW * 0.75), parseInt(winH * 0.15))

      this.thisWindow.on('resize', () => {
        const totalHeight = document.body.clientHeight
        if (this.headerHeight === 0) {
          this.headerHeight = this.$refs.header.$el.offsetHeight
          this.footerHeight = this.$refs.footer.$el.offsetHeight
        }
        this.listHeight = totalHeight - this.headerHeight - this.footerHeight
      })
      if (!await this.mediaStreamInit()) return
      this.writeLog('初始化完成')
      this.server.On('Offer', this.sendOffer)
      this.server.On('Answer', this.sendAnswer)
      this.server.On('Candidate', this.sendCandidate)
      this.server.On('Leave', this.sendOffer)

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
      setInterval(() => {
        this.RTCConnectionList.forEach(async connection => {
          connection.getStats(null).then(result => {
            // monitor bitrate and upload
          })
        })
      }, 1000)
      // this.RTCConnectionList.push(new RTCPeerConnection(this.RTCConfigure))
      // this.writeLog('已新建RTC连接, 等待连接...')
    },
    async closeWindow () {
      const res = await Confirm('确认要结束推流吗？', '提醒')
      if (res) {
        if (this.tray) this.tray.destroy()
        this.thisWindow.close()
      }
    },
    setTopMost () {
      this.topMost = !this.topMost
      this.thisWindow.setAlwaysOnTop(this.topMost)
      this.updateMenu()
    },
    minimizeWindow () {
      if (this.thisWindow.isMinimized()) {
        this.thisWindow.restore()
        this.thisWindow.focus()
      } else {
        this.thisWindow.minimize()
      }
    },
    setIgnoreMouse () {
      this.ignoreMouse = !this.ignoreMouse
      this.thisWindow.setIgnoreMouseEvents(this.ignoreMouse, { forward: true })
      this.updateMenu()
    },
    async mediaStreamInit () {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const VideoInput = devices.find(x => x.kind === 'videoinput' && x.label.includes('OBS Virtual Camera'))
      if (!VideoInput) {
        this.writeLog('未找到OBS虚拟摄像头，无法进行推流')
        return false
      }
      const AudioInput = devices.find(x => x.kind === 'audioinput' && x.label === this.config.audio_Input)
      const audio = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        }
      })
      audio.getTracks().filter(x => x.kind === 'audio').forEach(track => {
        this.remoteVideo.addTrack(track)
      })
      const video = await navigator.mediaDevices.getUserMedia({
        video:
        {
          deviceId: VideoInput.deviceId,
          frameRate: this.config.framerate_Stream,
          latency: 0
        },
        audio: AudioInput ? { deviceId: AudioInput.deviceId } : false
      })
      video.getTracks().filter(x => x.kind === 'video').forEach(track => {
        console.log(track)
        this.remoteVideo.addTrack(track)
      })
      return true
    },
    async sendOffer (data) {
      if (this.RTCConnectionList.has(data.data.from)) {
        // ?
        const PeerConnection = this.RTCConnectionList.get(data.data.from)
        PeerConnection.close()
        PeerConnection.ontrack = null
        PeerConnection.onicecandidate = null
      }
      const PeerConnection = new RTCPeerConnection(this.RTCConfigure)
      PeerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.server.Emit('Candidate', { data: e.candidate, to: data.data.from })
        }
      }
      if (this.remoteVideo) this.remoteVideo.getTracks().forEach(x => PeerConnection.addTrack(x))

      const offer = await PeerConnection.createOffer()
      this.server.Emit('Offer', { data: offer, to: data.data.from })
      PeerConnection.setLocalDescription(offer)
      const sender = PeerConnection.getSenders()[0]
      const videoParameters = sender.getParameters()
      if (JSON.stringify(videoParameters) === '{}') {
        videoParameters.encodings = []
        videoParameters.encodings[0] = {}
      }
      videoParameters.encodings[0].maxBitrate = this.config.bitrate_Stream * 1000
      videoParameters.degradationPreference = 'balanced'
      // console.warn('videoParameters: \n', JSON.stringify(videoParameters, null, '   '))
      await sender.setParameters(videoParameters)
      this.RTCConnectionList.set(data.data.from, PeerConnection)
    },
    async sendCandidate (data) {
      await this.RTCConnectionList.get(data.data.from).addIceCandidate(new RTCIceCandidate(data.data.candidate))
    },
    async sendAnswer (data) {
      const parsedSdp = SDPTools.parseSDP(data.data.answer.sdp)
      for (let i = 0; i < parsedSdp.media.length; i++) {
        const media = parsedSdp.media[i]
        const codec = ['VP9', 'VP8']
        var ASBitrate = document.getElementById('ASBitrate').value
        ASBitrate = ASBitrate || 4096
        SDPTools.removeCodecByName(parsedSdp, i, codec)
        SDPTools.setXgoogleBitrate(parsedSdp, ASBitrate, i)
        SDPTools.removeRembAndTransportCC(parsedSdp, i)
        media.payloads = media.payloads.trim()
      }
      data.answer.sdp = SDPTools.writeSDP(parsedSdp)
      await this.RTCConnectionList.get(data.data.from).setRemoteDescription(data.data.answer)
    },
    sendLeave (data) {
      if (this.RTCConnectionList.has(data.data.from)) {
        const PeerConnection = this.RTCConnectionList.get(data.data.from)
        PeerConnection.close()
        PeerConnection.ontrack = null
        PeerConnection.onicecandidate = null
        this.RTCConnectionList.delete(data.data.from)
      } else {
        // ?
      }
    }
  }
}
</script>

<style scoped>
.draggable {
  cursor: move; /* 无法与拖拽属性共存 */
  background-color: rgba(100,100,100,.4) !important;
  -webkit-app-region: drag;
}
#toolBar{
  transition: all .2s;
}
#toolBar:hover{
  background-color: rgba(100,100,100,.7) !important;
}
.halfTransplant{
  background-color: rgba(100,100,100,.4) !important;
}
#frameMain {
  background:unset !important;
}
button{
  -webkit-app-region: no-drag;
}
#danmukuList::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
#danmukuList::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : skyblue;
}
#danmukuList::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
}
</style>
