<template>
  <div style="display: flex;height:100%;" @mousemove="toolbarActiveChange" data-app="true">
    <div id="videoContainer" @contextmenu="showMenu">
      <div class="slimScrollbar" id="logs" v-if="showLogs">
        <p v-for="log in logs" :key="log.id">{{log.content}}</p>
        <p id="logBottom"></p>
      </div>
      <div id="danmukuContainer" ref="danmukuContainer" v-show="showDanmuku" style="position: absolute; width: 100%; z-index: 9; height:95%">
      </div>
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
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" icon @click="danmukuSenderControlBoxShow=!danmukuSenderControlBoxShow"><v-icon>mdi-alpha-a-box-outline</v-icon></v-btn>
          </template>
          <span>弹幕设置</span>
        </v-tooltip>
        <div id="danmukuSender" style="position: relative;">
          <v-fade-transition>
            <div v-if="danmukuSenderControlBoxShow" id="danmukuSenderControlBox" class="popBox" @mouseleave="danmukuSenderControlBoxShow=false" style="padding-bottom: 0">
              <div style="display: flex; align-items: center;">
                <span>弹幕位置</span>
                <div style="margin-left: 5px;border-radius: 5px; overflow: hidden;">
                  <v-btn-toggle mandatory dark v-model="danmukuConfig.Position" :color="$vuetify.theme.themes.light.primary">
                    <v-btn small text value="0">滚动</v-btn>
                    <v-btn small text value="1">顶部</v-btn>
                    <v-btn small text value="2">底部</v-btn>
                  </v-btn-toggle>
                </div>
              </div>
              <div style="display: flex; align-items: center;margin-top: 10px;">
                <span>弹幕颜色</span>
                <div class="colorBlock" :style="`background-color:${danmukuConfig.Color};`">
                </div>
              </div>
              <div id="danmukuColorBlocks" style="display: flex; align-items: center; margin-top: 10px;">
                <div class="colorBlock" v-for="color in danmukuColors" :key="color.color" :style="`background-color:${color};`" @click="danmukuConfig.Color=color"></div>
              </div>
              <div style="display: flex; margin-top: 15px;">
                <v-text-field dense dark solo v-model="danmukuConfig.Color"></v-text-field>
                <v-btn dark style="margin-left: 5px;" @click="danmukuConfig.Color='#ffffff'">重置</v-btn>
              </div>
            </div>
          </v-fade-transition>

          <input :disabled="!showDanmuku" v-model="danmukuInput" @keydown.enter="sendDanmuku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmukuSender">
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
        <v-hover v-slot="{ hover }">
          <div>
            <v-btn icon><v-icon>mdi-message-question-outline</v-icon></v-btn>
            <v-fade-transition>
              <div v-if="hover" id="danmukuControlBox" class="popBox">
                <v-checkbox :color="$vuetify.theme.themes.light.primary" dark dense height="15" label="弹幕屏蔽生效开关" v-model="danmukuBlocker.switch"></v-checkbox>
                <span style="color: rgba(255, 255, 255, 0.7);">屏蔽设置</span>
                <v-tabs style="margin-bottom: 5px;" dark fixed-tabs :color="$vuetify.theme.themes.light.primary" v-model="danmukuBlockerItem">
                  <v-tab href="#tab-1">
                    关键字
                  </v-tab>
                  <v-tab href="#tab-2">用户</v-tab>
                </v-tabs>
                <v-tabs-items v-model="danmukuBlockerItem">
                  <v-tab-item
                    value="tab-1"
                  >
                    <v-list id="blockerList" class="slimScrollbar" subheader>
                      <v-subheader>
                        <span>共有屏蔽词 {{danmukuBlocker.keywords.length}} 个</span>
                        <v-btn icon small @click="clearDanmukuBlocker('keywords')"><v-icon>mdi-delete</v-icon></v-btn>
                      </v-subheader>
                      <v-list-item dense v-for="item in danmukuBlocker.keywords" :key="item">
                        <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{item}}</span>
                        <v-btn icon @click="removeDanmukuBlocker('keywords',item)"><v-icon>mdi-close</v-icon></v-btn>
                      </v-list-item>
                      <v-list-item dense v-if="danmukuBlocker.keywords.length===0">
                        <span style="width: 100%; text-align: center;">(・ω・) 列表为空</span>
                      </v-list-item>
                    </v-list>
                    <div style="display: flex; align-items: baseline; margin-bottom: 5px; margin-right: 5px;">
                      <v-text-field hide-details="auto" label="关键词或正则表达式" clearable dense style="margin: 0 10px;" v-model="danmukuBlockerTmpWord"></v-text-field>
                      <v-btn dark @click="addBlockKeyword">添加</v-btn>
                    </div>
                  </v-tab-item>
                  <v-tab-item
                    value="tab-2"
                  >
                    <v-list id="blockerList" class="slimScrollbar">
                      <v-subheader>
                        <span>共屏蔽用户 {{danmukuBlocker.users.length}} 个</span>
                        <v-btn icon small @click="clearDanmukuBlocker('users')"><v-icon>mdi-delete</v-icon></v-btn>
                      </v-subheader>

                      <v-list-item dense v-for="item in danmukuBlocker.users" :key="item.id">
                        <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{item.name}} - UID:{{item.id}}</span>
                        <v-btn icon @click="removeDanmukuBlocker('users',item)"><v-icon>mdi-close</v-icon></v-btn>
                      </v-list-item>
                      <v-list-item dense v-if="danmukuBlocker.users.length===0">
                        <span style="width: 100%; text-align: center;">(・ω・) 列表为空</span>
                      </v-list-item>
                    </v-list>
                  </v-tab-item>
                </v-tabs-items>
              </div>
            </v-fade-transition>
          </div>
        </v-hover>
        <v-hover v-slot="{ hover }">
          <div>
            <v-btn icon><v-icon>mdi-message-cog-outline</v-icon></v-btn>
            <v-fade-transition>
              <div v-if="holdHover||hover" id="danmukuControlBox" class="popBox">
                <v-container style="display: flex;align-items: baseline;">
                  <v-autocomplete hide-details height="15" @focus="holdHover=true" @blur="holdHover=false" v-model="danmukuConfig.FontFamily" :items="fontList" outlined dense solo dark label="弹幕字体" style="width: 70%;"></v-autocomplete>
                  <v-checkbox :color="$vuetify.theme.themes.light.primary" hide-details height="15" v-model="danmukuConfig.Bold" label="粗体" dense dark></v-checkbox>
                </v-container>
                <v-slider height="15" label="弹幕大小" min="12" max="30" v-model="danmukuConfig.FontSize" thumb-label :thumb-size="30" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
                <v-slider height="15" label="弹幕透明" min="3" max="10" v-model="danmukuConfig.Opacity" thumb-label :thumb-size="30" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary">
                  <template v-slot:thumb-label="{ value }">
                    {{ value*10 }}%
                  </template>
                </v-slider>
                <v-slider height="15" label="弹幕速度" min="5" max="200" v-model="danmukuConfig.Speed" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
                <v-slider height="15" label="显示区域" v-model="danmukuConfig.Height" :thumb-size="30" step="25" min="25" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary">
                  <template v-slot:thumb-label="{ value }">
                    {{ showAreaText(value) }}
                  </template>
                </v-slider>
              </div>
            </v-fade-transition>
          </div>
        </v-hover>
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
      <v-list subheader id="danmukuList" class="slimScrollbar">
        <v-subheader>弹幕列表</v-subheader>
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
import { Info, Confirm } from '@/utils/dialog'
import flvjs from 'flv.js'
import { getFonts } from 'font-list'
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
      danmukuListShow: false,
      danmukuList: [],
      menuDanmuku: false,
      maxDanmukuCount: 20,
      danmukuID: 0,
      currentDanmuku: {},
      danmukuSenderControlBoxShow: false,
      danmukuConfig: {
        FontFamily: '微软雅黑',
        Bold: true,
        FontSize: 20,
        Height: 75,
        Speed: 50,
        Position: '0',
        Color: '#ffffff',
        Opacity: 10
      },
      danmukuBlockerItem: null,
      danmukuBlockerTmpWord: '',
      danmukuBlocker: {
        switch: true,
        keywords: [],
        users: [{ name: 'aaa', id: 1 }]
      },
      fontList: [],
      holdHover: false,
      danmukuItemList: [],
      danmukuLastStep: 0,
      danmukuMaxStep: 26,
      danmukuColors: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#66ccff', '#7fffd4', '#00bfff', '#98fb98']
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
      if (this.danmukuCD !== 0 || !this.showDanmuku) return '#a9a9a9'
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
    getFonts({ disableQuoting: true }).then(fonts => {
      this.fontList = fonts.sort((a, b) => -1)
    }).catch(err => {
      console.log(err)
    })
    this.$vuetify.theme.dark = true
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
      if (isDanmukuMenu) {
        this.currentDanmuku = this.danmukuList.find(x => x.id === id)
      }
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
      if (this.danmukuCD || !this.showDanmuku) return
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
          this.AddDanmuku(this.danmukuInput, this.danmukuConfig.Color, this.danmukuConfig.Position)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Danmuku', {
        content: this.danmukuInput,
        color: '#ffffff'
      })
      this.AddDanmuku(this.danmukuInput, this.danmukuConfig.Color, this.danmukuConfig.Position)
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
      return moment(time).format('HH:mm:ss')
    },
    clickable () {},
    danmukuListToggle () {
      this.danmukuListShow = !this.danmukuListShow
    },
    createDanmukuElement (text, color, position = '0', fontSize = 20, bold = true, fontFamily = 'Microsoft YaHei') {
      let element = document.createElement('span')
      this.$refs.danmukuContainer.appendChild(element)
      element.position = position
      element.innerText = text
      element.style = `font-size: ${fontSize}px; opacity: ${this.danmukuConfig.Opacity / 10}; color: ${color}; font-family: ${fontFamily}; font-weight: ${bold ? 'bold' : 'normal'}`
      element.click = this.clickable
      element.style.width = element.offsetWidth + 'px'
      element.classList.add('danmukuBase')

      // baseSpeed 定义为多长时间移动 1px, 一般宽度为1580px, 假定15s跑完, 则此值为 15000/1580 = 9.5
      // 此值不会因为窗口变化而变化, 所以是经验向数值
      const baseSpeed = 9.5
      const speed = baseSpeed * (1 / (this.danmukuConfig.Speed / 50))

      if (position === '0') {
        element = this.createRollDanmuku(element)
      } else {
        element = this.createStillDanmuku(element, position)
      }

      this.danmukuMoveAnime(element, position === '0', speed)
      this.danmukuItemList.push(element)
      // element.addEventListener('webkitAnimationEnd', () => {
      //   this.$refs.danmukuContainer.removeChild(element)
      // })
    },
    createRollDanmuku (element) {
      element.classList.add('danmukuRollItem')

      const height = element.offsetHeight
      let step = 0
      let findFlag = false
      const containerWidth = this.$refs.danmukuContainer.clientWidth
      this.danmukuMaxStep = parseInt((this.$refs.danmukuContainer.offsetHeight * this.danmukuConfig.Height / 100) / height)
      for (let i = 0; i <= this.danmukuMaxStep; i++) {
        const len = this.danmukuItemList.filter(x => x.step === step && x.position === '0' && containerWidth - x.offsetLeft - x.clientWidth < x.clientWidth)
        if (len.length === 0) {
          findFlag = true
          break
        } else {
          step++
        }
      }
      if (!findFlag) {
        if (this.danmukuLastStep === this.danmukuMaxStep) {
          this.danmukuLastStep = 0
        } else {
          this.danmukuLastStep++
        }

        element.step = this.danmukuLastStep
        step = element.step
        const arr = this.danmukuItemList.filter(x => x.step === this.danmukuLastStep)
        const lastElement = arr[arr.length - 1]
        const rightOffset = containerWidth - lastElement.offsetLeft - lastElement.clientWidth
        element.style.right = `${rightOffset - lastElement.clientWidth - 5}px`
      } else {
        this.danmukuLastStep = step
      }
      element.step = step
      element.style.top = `${step * height}px`
      return element
    },
    createStillDanmuku (element, position) {
      element.classList.add('danmukuStillItem')

      const height = element.offsetHeight
      let step = 0
      let findFlag = false
      const danmukuMaxStepVertical = parseInt((this.$refs.danmukuContainer.offsetHeight * 0.45) / height)
      for (let i = 0; i <= danmukuMaxStepVertical; i++) {
        const len = this.danmukuItemList.filter(x => x.step === step && x.position === position)
        if (len.length === 0) {
          findFlag = true
          break
        } else {
          step++
        }
      }
      if (!findFlag) {
        if (this.danmukuLastStep === danmukuMaxStepVertical) {
          this.danmukuLastStep = 0
        } else {
          this.danmukuLastStep++
        }

        element.step = this.danmukuLastStep
        step = element.step
      } else {
        this.danmukuLastStep = step
      }
      element.step = step
      if (position === '1') {
        element.style.top = `${step * height}px`
      } else {
        element.style.bottom = `${step * height}px`
      }
      return element
    },
    danmukuMoveAnime (element, isRoll, speed) {
      if (!isRoll) {
        setTimeout(() => {
          this.$refs.danmukuContainer.removeChild(element)
          this.danmukuItemList.splice(this.danmukuItemList.indexOf(element), 1)
        }, 5000)
        return
      }
      const width = element.clientWidth
      let begin = this.$refs.danmukuContainer.clientWidth - element.offsetLeft - element.clientWidth
      const id = setInterval(() => {
        if (element.offsetLeft <= -width * 2) {
          // console.log('end')
          this.$refs.danmukuContainer.removeChild(element)
          this.danmukuItemList.splice(this.danmukuItemList.indexOf(element), 1)
          clearInterval(id)
          return
        }
        element.style.right = begin + 'px'
        begin++
      }, speed)
    },
    AddDanmuku (content, color, position) {
      if (!this.showDanmuku) return
      if (this.danmukuList.length > this.maxDanmukuCount) {
        this.danmukuList.splice(0, 1)
      }
      this.danmukuList.push({ id: this.danmukuID, content, color, position, time: new Date().getTime() })
      this.danmukuID++
      this.$nextTick(() => {
        document.querySelector('#danmukuBottom').scrollIntoView()
        this.createDanmukuElement(content, color, position, this.danmukuConfig.FontSize, this.danmukuConfig.Bold, this.danmukuConfig.FontFamily)
      })
    },
    showAreaText (value) {
      switch (value) {
        case 25: return '1/4'
        case 50: return '1/2'
        case 75: return '3/4'
        case 100: return '全屏'
      }
    },
    addBlockKeyword () {
      const keyword = this.danmukuBlockerTmpWord
      if (keyword.length === 0 || keyword.trim().length === 0) {
        this.snackbar.Error('关键词不能为空')
        return
      }
      if (this.danmukuBlocker.keywords.indexOf(keyword) !== -1) {
        this.snackbar.Error('关键词已存在')
        return
      }
      this.danmukuBlocker.keywords.push(keyword)
      this.danmukuBlockerTmpWord = ''
    },
    removeDanmukuBlocker (type, content) {
      switch (type) {
        case 'keywords':
          this.danmukuBlocker.keywords.splice(this.danmukuBlocker.keywords.indexOf(content), 1)
          break
        case 'users':
          this.danmukuBlocker.users.splice(this.danmukuBlocker.users.indexOf(content), 1)
          break
        default:
          break
      }
    },
    async clearDanmukuBlocker (type) {
      const res = await Confirm('是否清空此屏蔽项目', '确认')
      if (res) {
        switch (type) {
          case 'keywords':
            this.danmukuBlocker.keywords = []
            break
          case 'users':
            this.danmukuBlocker.users = []
            break
          default:
            break
        }
      }
    }
  },
  beforeDestroy () {
    this.server.Emit('Leave', {})
  }
}
</script>
<style>
@keyframes danmukuAnime {
  from {right: 0;}
  to {right: 140%;}
}
.danmukuBase {
  position: absolute;
  user-select: none;
  pointer-events: none;
  /* 我超，为什么b站弹幕是用canvas画的 */
  /* -webkit-text-stroke: 1px white; */
  /* text-shadow: 1px 1px #fff; */
}
.danmukuRollItem {
  right: 0px;
  transform: translate(100%);
}
.danmukuStillItem {
  left: 50%;
  transform: translate(-50%);
}
.v-label--active {
  transform-origin: top left;
}
</style>

<style scoped>
#blockerList {
  max-height: 150px;
  overflow-y: scroll;
  overflow-x: hidden;
  text-overflow: ellipsis;
}

#danmukuList {
  overflow-y: scroll;
  height: 100%;
  width: 100%;
}
.slimScrollbar::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
.slimScrollbar::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : #535353;
}
.slimScrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
}

#danmukuListContainer {
  width: 25%;
  background: whitesmoke;
  transition: all .2s;
  z-index: 10;
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
.popBox {
  position: absolute;
  z-index: 15;
  background: rgba(100,100,100,.5);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 15;
}
#danmukuControlBox{
  width: 250px;
  bottom: 100%;
  transform: translate(-55%);
}
#danmukuSenderControlBox {
  width: 250px;
  bottom: 100%;
  transform: translate(-55%);
}
.colorBlock {
  width: 15px;
  height: 15px;
  margin-left: 5px;
  border: 2px solid white;
  border-radius: 3px;
}
</style>
