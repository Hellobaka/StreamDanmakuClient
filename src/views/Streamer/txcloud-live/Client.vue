<template>
  <div style="display: flex;height:100%;" @mousemove="toolbarActiveChange" data-app="true">
    <div id="videoContainer" @contextmenu="showMenu">
      <div id="logs" v-if="showLogs">
        <p v-for="log in logs" :key="log.id">{{log.content}}</p>
        <p id="logBottom"></p>
      </div>
      <div id="danmukuContainer" :style="`position: absolute; width: 100%; z-index: 9; height:${danmukuConfig.Height}%`"></div>
      <div id="danmukuListToggle" @click="danmukuListToggle">
        <div id="danmukuListToggleArrow" v-bind:class="{'danmukuListToggleArrowReverse': danmukuListShow}"></div>
      </div>
      <video id="video-container" style="width:100%; height:100%;"></video>
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
        <div id="danmukuSender">
          <input v-model="danmukuInput" @keydown.enter="sendDanmuku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmukuSender">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="sendDanmuku" v-on="on" v-bind="attrs" :color="danmukuSenderColor" style="color: white;">{{danmukuSenderText}}</v-btn>
            </template>
            <span>发送弹幕</span>
          </v-tooltip>
        </div>
        <v-spacer></v-spacer>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="showDanmukuChange" v-on="on" v-bind="attrs" icon><v-icon>{{danmukuSwitchIcon}}</v-icon></v-btn>
          </template>
          <span>{{showDanmuku?'关闭':'打开'}}弹幕</span>
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
    <div id="danmukuListContainer" v-bind:class="{'danmukuListHidden': !danmukuListShow}">
      <v-list id="danmukuList">
        <v-list-item v-for="item in danmukuList" :key="item.id" dense style="flex-wrap: wrap;" @mousedown.right.stop="showMenu($event, true, item.id)">
          <span style="color:skyblue">
            [{{timeFormat(item.time)}}]
          </span>
          <span style="word-break: break-all;word-wrap: break-word;overflow: auto;">{{item.content}}</span>
        </v-list-item>
        <v-menu v-model="menuDanmuku" :position-x="menuX" :position-y="menuY" absolute offset-y>
          <v-list min-width="150px" dark style="background-color: rgba(100,100,100,.8);">
            <v-list-item @click="clickable">复制{{currentDanmuku.content}}</v-list-item>
            <v-list-item @click="clickable">添加好友</v-list-item>
            <v-list-item @click="clickable">复读</v-list-item>
            <v-list-item dense><v-divider></v-divider></v-list-item>
            <v-list-item @click="clickable">清空弹幕</v-list-item>
          </v-list>
        </v-menu>
        <div id="danmukuBottom"></div>
      </v-list>
    </div>
  </div>
</template>

<script>
import { loadLocalConfig, writeLocalConfig } from '@/utils/tools'
import moment from 'moment'
import { Info } from '@/utils/dialog'
import flvjs from 'flv.js'
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
      danmukuInput: '',
      showDanmuku: true,
      danmukuInputFlag: false,
      activeChangeCounter: 0,
      danmukuCD: 0,
      danmukuCDTimer: 0,
      menu: false,
      menuX: 0,
      menuY: 0,
      logs: [],
      showLogs: true,
      roomInstance: {},
      videoPlayer: null,
      catchFrameTimer: 0,
      danmukuListShow: true,
      danmukuList: [],
      menuDanmuku: false,
      maxDanmukuCount: 20,
      danmukuID: 0,
      currentDanmuku: {},
      danmukuConfig: {
        Height: 75
      }
    }
  },
  computed: {
    volIcon: function () {
      if (this.vols === 0) return 'mdi-volume-mute'
      else if (this.vols < 50) return 'mdi-volume-medium'
      else return 'mdi-volume-high'
    },
    danmukuSenderText: function () {
      if (this.danmukuCD !== 0) return `${this.danmukuCD}秒`
      return '发送'
    },
    danmukuSenderColor: function () {
      if (this.danmukuCD !== 0) return '#a9a9a9'
      return this.$vuetify.theme.themes.light.primary
    },
    danmukuSwitchIcon: function () {
      return this.showDanmuku ? 'mdi-message-processing-outline' : 'mdi-message-off-outline'
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
      this.server.On('RoomClose', this.handleRoomClose)
      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    }
    this.server.CallStreamGetInfo()
    this.videoContainer = document.querySelector('#video-container')
    const timeout = 1500
    setInterval(() => {
      if (!this.toolbarActive || this.danmukuInputFlag) return
      this.activeChangeCounter++
      if (this.activeChangeCounter === timeout) {
        this.toolbarActive = false
      }
    }, 100)
    this.showDanmuku = !!this.config.danmukuDefault
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
      this.danmukuInputFlag = true
      this.$refs.danmukuSender.style.boxShadow = `0px 0px 20px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    inputOnBlur () {
      this.danmukuInputFlag = false
      this.$refs.danmukuSender.style.boxShadow = `0px 0px 0px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    toolbarActiveChange () {
      this.toolbarActive = true
      this.activeChangeCounter = 0
    },
    reconnect () {
      this.server.Emit('Leave', {})
      this.videoPlayer.unload()
      this.writeLog('主动放弃连接成功，开始重新请求连接')

      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    },
    showMenu (e, isDanmukuMenu = false, id = 0) {
      e.preventDefault()
      this.menu = false
      this.menuDanmuku = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.currentDanmuku = this.danmukuList.find(x => x.id === id)
      this.$nextTick(() => {
        if (isDanmukuMenu) {
          this.menuDanmuku = true
        } else { this.menu = true }
      })
    },
    clickHandle () {},
    playStatusChange () {
      if (this.playStatus) {
        this.playStatus = false
        this.videoPlayer.pause()
      } else {
        this.playStatus = true
        this.videoPlayer.play()
      }
    },
    writeLog (log) {
      if (!log) return
      if (!this.showLogs) {
        setTimeout(() => {
          this.showLogs = false
        }, 2500)
      }
      this.showLogs = true
      this.logs.push({ id: this.logs.length, content: `[${moment().format('yyyy-MM-DD HH:mm:ss')}] ${log}`, time: new Date().getTime() })
      this.$nextTick(() => {
        document.querySelector('#logBottom').scrollIntoView()
      })
    },
    sendDanmuku () {
      if (this.danmukuCD) return
      if (this.danmukuCDTimer) {
        clearInterval(this.danmukuCDTimer)
      }
      this.danmukuCD = 1
      this.danmukuCDTimer = setInterval(() => {
        if (this.danmukuCD === 0) return
        this.danmukuCD--
      }, 1000)
      this.server.On('Danmuku', data => {
        if (data.code === 200) {
          this.AddDanmuku(this.danmukuInput, '#ffffff')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Danmuku', {
        content: this.danmukuInput,
        color: '#ffffff'
      })
      this.AddDanmuku(this.danmukuInput, '#ffffff')
      this.danmukuInput = ''
    },
    showDanmukuChange () {
      this.showDanmuku = !this.showDanmuku
      if (this.config.danmukuRemember) {
        writeLocalConfig('Config', 'danmukuDefault', this.showDanmuku)
      }
    },
    async handleRoomEnter (data) {
      if (data.code !== 200) {
        this.snackbar.Error(data.msg)
      } else {
        this.server.On('GetPullUrl', data => {
          if (data.code === 200) {
            this.writeLog('拉流地址获取成功')
            if (flvjs.isSupported()) {
              // this.createVideo(data.data.server + data.data.key)
              this.writeLog('播放器初始化成功，尝试播放...')
            }
          }
        })
        this.writeLog('房间加入成功')
        this.roomInstance = data.data.roomInfo
        this.server.Emit('GetPullUrl', { type: 1 })
      }
    },
    handleRoomVanish () {
      console.log('Receive room exit')
      this.videoPlayer.unload()
      Info('与房主断开连接，点击确定返回房间列表', '连接中断').then(() => {
        this.thisWindow.close()
      })
    },
    handleRoomClose () {
      console.log('Receive room exit')
      this.videoPlayer.unload()
      Info('与房主中断了连接，点击确定返回房间列表', '连接中断').then(() => {
        this.thisWindow.close()
      })
    },
    volChange () {
      this.videoPlayer.volume = this.vols / 100
    },
    createVideo (url) {
      const videoElement = document.getElementById('video-container')
      const player = flvjs.createPlayer({
        type: 'flv',
        url,
        isLive: true
      })
      player.on(flvjs.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        this.loading = true
        this.writeLog('errorType:' + errorType)
        this.writeLog('errorDetail:' + errorDetail)
        this.writeLog('errorInfo:' + errorInfo)
        // this.loadStatus=true
        this.writeLog('3s后尝试重连...')
        // this.statusMsg="正在重连。。。"
        // 视频出错后销毁重新创建
        if (player) {
          player.pause()
          player.unload()
          player.detachMediaElement()
          player.destroy()
        }
        setTimeout(() => {
          this.createVideo(url)
        }, 3000)
      })
      player.on(flvjs.Events.LOADING_COMPLETE, () => {
        this.loading = true
        player.pause()
        player.unload()
        player.detachMediaElement()
        player.destroy()
        this.writeLog('主播切断了直播')
      })
      player.on(flvjs.Events.METADATA_ARRIVED, () => {
        this.loading = false
        this.writeLog('拉流元数据获取成功')
        player.play()
        this.catchFrameTimer = setInterval(() => {
          if (videoElement.buffered.length > 0) {
            const end = videoElement.buffered.end(0) // 视频结尾时间
            const current = videoElement.currentTime //  视频当前时间
            const diff = end - current// 相差时间
            // console.log(diff)
            const diffCritical = 4 // 这里设定了超过4秒以上就进行跳转
            const diffSpeedUp = 1 // 这里设置了超过1秒以上则进行视频加速播放
            const maxPlaybackRate = 4// 自定义设置允许的最大播放速度
            let playbackRate = 1.0 // 播放速度
            if (diff > diffCritical) {
              console.log('相差超过4秒，进行跳转')
              videoElement.currentTime = end - 1.5
              playbackRate = Math.max(1, Math.min(diffCritical, 16))
            } else if (diff > diffSpeedUp) {
              console.log('相差超过1秒，进行加速')
              playbackRate = Math.max(1, Math.min(diff, maxPlaybackRate, 16))
            }
            videoElement.playbackRate = playbackRate
            if (videoElement.paused) {
              player.play()
            }
          }
        }, 1000)
      })
      player.attachMediaElement(videoElement)
      player.load()

      player.on(flvjs.Events.MEDIA_INFO, info => {
        this.writeLog(`视频信息：${JSON.stringify(info)}`)
      })
      this.videoPlayer = player
    },
    timeFormat (time) {
      return moment(time).format('yyyy-MM-DD HH:mm:ss')
    },
    clickable () {},
    danmukuListToggle () {
      this.danmukuListShow = !this.danmukuListShow
    },
    AddDanmuku (content, color) {
      if (this.danmukuList.length > this.maxDanmukuCount) {
        this.danmukuList.splice(0, 1)
      }
      this.danmukuList.push({ id: this.danmukuID, content, color, time: new Date().getTime() })
      this.danmukuID++
      this.$nextTick(() => {
        document.querySelector('#danmukuBottom').scrollIntoView()
      })
    }
  },
  beforeDestroy () {
    this.server.Emit('Leave', {})
  }
}
</script>

<style scoped lang="scss">
#danmukuList {
  overflow-y: scroll;
  height: 100%;
  width: 100%;
}
#danmukuList::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
#danmukuList::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : #535353;
}
#danmukuList::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
}

#danmukuListContainer {
  width: 25%;
  background: whitesmoke;
  transition: all .2s;
}
.danmukuListHidden {
  width: 0 !important;
}
#danmukuListToggle {
  opacity: 0;
  transition: all 0.5s;
  position: absolute;
  height: 20%;
  width: 15px;
  background: white;
  right: 0;
  top: 40%;
  box-shadow: 5px 0px 5px #888888;
  border-radius: 10px 0px 0px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  cursor: pointer;
}
#danmukuListToggle:hover {
  opacity: 1;
}
#danmukuListToggleArrow {
  width: 7px;
  height: 7px;
  border-left: 2px solid black;
  border-bottom: 2px solid black;
  transform: rotate(45deg);
  transition: all .2s;
}
.danmukuListToggleArrowReverse {
  transform: rotate(225deg) !important;
}
#danmukuSender {
  display: flex;
  width: 50%;
}
#logClose {
  position: absolute;
  right: 0px;
  top: 0;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  color: black;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
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
  background: rgba(100,100,100,.9);
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
