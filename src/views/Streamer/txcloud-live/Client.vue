<template>
  <div id="clientFrame" style="display: flex;height: 802px;" @mousemove="toolbarActiveChange" data-app="true">
    <div id="videoContainer" @contextmenu="showMenu">
      <div class="slimScrollbar" id="logs" v-if="showLogs">
        <p v-for="log in logs" :key="log.id">{{log.Content}}</p>
        <p id="logBottom"></p>
      </div>
      <div id="danmakuContainer" ref="danmakuContainer" v-show="showDanmaku" style="position: absolute; width: 100%; z-index: 9; height:95%">
      </div>
      <div id="danmakuListToggle" @click="danmakuListToggle">
        <div id="danmakuListToggleArrow" v-bind:class="{'danmakuListToggleArrowReverse': danmakuListShow}"></div>
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
      <div class="videoToolBar" style="bottom: 0;" v-bind:class="{'toolbarInactive': !toolbarActive}">
        <v-tooltip top color="rgba(100,100,100,.5)">
          <template v-slot:activator="{ on, attrs }">
            <v-btn dark v-on="on" v-bind="attrs" icon @click="playStatusChange"><v-icon>{{playButtonIcon}}</v-icon></v-btn>
          </template>
          <span>{{playStatus?'暂停': '播放'}}</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn dark v-on="on" v-bind="attrs" icon @click="reconnect"><v-icon>mdi-refresh</v-icon></v-btn>
          </template>
          <span>重新连接</span>
        </v-tooltip>
        <v-hover v-slot="{ hover }">
          <div id="volControl">
            <v-btn dark icon @click="volClick">
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
            <v-btn dark v-on="on" v-bind="attrs" icon @click="danmakuSenderControlBoxShow=!danmakuSenderControlBoxShow"><v-icon>mdi-alpha-a-box-outline</v-icon></v-btn>
          </template>
          <span>弹幕设置</span>
        </v-tooltip>
        <div id="danmakuSender" style="position: relative;">
          <v-fade-transition>
            <div v-if="danmakuSenderControlBoxShow" id="danmakuSenderControlBox" class="popBox" @mouseleave="danmakuSenderControlBoxShow=false" style="padding-bottom: 0">
              <div style="display: flex; align-items: center;">
                <span>弹幕位置</span>
                <div style="margin-left: 5px;border-radius: 5px; overflow: hidden;">
                  <v-btn-toggle mandatory dark v-model="danmakuConfig.Position" :color="$vuetify.theme.themes.light.primary">
                    <v-btn small text value="0">滚动</v-btn>
                    <v-btn small text value="1">顶部</v-btn>
                    <v-btn small text value="2">底部</v-btn>
                  </v-btn-toggle>
                </div>
              </div>
              <div style="display: flex; align-items: center;margin-top: 10px;">
                <span>弹幕颜色</span>
                <div class="colorBlock" :style="`background-color:${danmakuConfig.Color};`">
                </div>
              </div>
              <div id="danmakuColorBlocks" style="display: flex; align-items: center; margin-top: 10px;">
                <div class="colorBlock" v-for="color in danmakuColors" :key="color.color" :style="`background-color:${color};`" @click="danmakuConfig.Color=color"></div>
              </div>
              <div style="display: flex; margin-top: 15px;">
                <v-text-field dense dark solo v-model="danmakuConfig.Color"></v-text-field>
                <v-btn dark style="margin-left: 5px;" @click="danmakuConfig.Color='#ffffff'">重置</v-btn>
              </div>
            </div>
          </v-fade-transition>

          <input :disabled="!showDanmaku" v-model="danmakuInput" @keydown.enter="sendDanmaku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmakuSender">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn dark @click="sendDanmaku" v-on="on" v-bind="attrs" :color="danmakuSenderColor" style="color: white;">{{danmakuSenderText}}</v-btn>
            </template>
            <span>发送弹幕</span>
          </v-tooltip>
        </div>
        <v-spacer></v-spacer>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn dark @click="showDanmakuChange" v-on="on" v-bind="attrs" icon><v-icon>{{danmakuSwitchIcon}}</v-icon></v-btn>
          </template>
          <span>{{showDanmaku?'关闭':'打开'}}弹幕</span>
        </v-tooltip>
        <v-hover v-slot="{ hover }">
          <div>
            <v-btn dark icon><v-icon>mdi-message-question-outline</v-icon></v-btn>
            <v-fade-transition>
              <div v-if="hover" id="danmakuControlBox" class="popBox">
                <v-checkbox :color="$vuetify.theme.themes.light.primary" dark dense height="15" label="弹幕屏蔽生效开关" v-model="danmakuBlocker.switch"></v-checkbox>
                <span style="color: rgba(255, 255, 255, 0.7);">屏蔽设置</span>
                <v-tabs style="margin-bottom: 5px;" dark fixed-tabs :color="$vuetify.theme.themes.light.primary" v-model="danmakuBlockerItem">
                  <v-tab href="#tab-1">
                    关键字
                  </v-tab>
                  <v-tab href="#tab-2">用户</v-tab>
                </v-tabs>
                <v-tabs-items v-model="danmakuBlockerItem">
                  <v-tab-item
                    value="tab-1"
                  >
                    <v-list id="blockerList" class="slimScrollbar" subheader>
                      <v-subheader>
                        <span>共有屏蔽词 {{danmakuBlocker.keywords.length}} 个</span>
                        <v-btn icon small @click="clearDanmakuBlocker('keywords')"><v-icon>mdi-delete</v-icon></v-btn>
                      </v-subheader>
                      <v-list-item dense v-for="item in danmakuBlocker.keywords" :key="item">
                        <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{item}}</span>
                        <v-btn icon @click="removeDanmakuBlocker('keywords',item)"><v-icon>mdi-close</v-icon></v-btn>
                      </v-list-item>
                      <v-list-item dense v-if="danmakuBlocker.keywords.length===0">
                        <span style="width: 100%; text-align: center;">(・ω・) 列表为空</span>
                      </v-list-item>
                    </v-list>
                    <div style="display: flex; align-items: baseline; margin-bottom: 5px; margin-right: 5px;">
                      <v-text-field hide-details="auto" label="关键词或正则表达式" clearable dense style="margin: 0 10px;" v-model="danmakuBlockerTmpWord"></v-text-field>
                      <v-btn dark @click="addBlockKeyword">添加</v-btn>
                    </div>
                  </v-tab-item>
                  <v-tab-item
                    value="tab-2"
                  >
                    <v-list id="blockerList" class="slimScrollbar">
                      <v-subheader>
                        <span>共屏蔽用户 {{danmakuBlocker.users.length}} 个</span>
                        <v-btn icon small @click="clearDanmakuBlocker('users')"><v-icon>mdi-delete</v-icon></v-btn>
                      </v-subheader>

                      <v-list-item dense v-for="item in danmakuBlocker.users" :key="item.id">
                        <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{{item.name}} - UID:{{item.id}}</span>
                        <v-btn icon @click="removeDanmakuBlocker('users',item)"><v-icon>mdi-close</v-icon></v-btn>
                      </v-list-item>
                      <v-list-item dense v-if="danmakuBlocker.users.length===0">
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
            <v-btn dark icon><v-icon>mdi-message-cog-outline</v-icon></v-btn>
            <v-fade-transition>
              <div v-if="holdHover||hover" id="danmakuControlBox" class="popBox">
                <v-container style="display: flex;align-items: baseline;">
                  <v-autocomplete hide-details height="15" @focus="holdHover=true" @blur="holdHover=false" v-model="danmakuConfig.FontFamily" :items="fontList" outlined dense solo dark label="弹幕字体" style="width: 70%;"></v-autocomplete>
                  <v-checkbox :color="$vuetify.theme.themes.light.primary" hide-details height="15" v-model="danmakuConfig.Bold" label="粗体" dense dark></v-checkbox>
                </v-container>
                <v-slider height="15" label="弹幕大小" min="12" max="30" v-model="danmakuConfig.FontSize" thumb-label :thumb-size="30" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
                <v-slider height="15" label="弹幕透明" min="3" max="10" v-model="danmakuConfig.Opacity" thumb-label :thumb-size="30" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary">
                  <template v-slot:thumb-label="{ value }">
                    {{ value*10 }}%
                  </template>
                </v-slider>
                <v-slider height="15" label="弹幕速度" min="5" max="200" v-model="danmakuConfig.Speed" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
                <v-slider height="15" label="显示区域" v-model="danmakuConfig.Height" :thumb-size="30" step="25" min="25" dark :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary">
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
            <v-btn dark v-on="on" v-bind="attrs" icon><v-icon>mdi-overscan</v-icon></v-btn>
          </template>
          <span>拉伸</span>
        </v-tooltip>
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn dark v-on="on" v-bind="attrs" icon @click="callScreenFull"><v-icon>mdi-fullscreen</v-icon></v-btn>
          </template>
          <span>全屏</span>
        </v-tooltip>
      </div>
    </div>
    <div id="danmakuListContainer" v-bind:class="{'danmakuListHidden': !danmakuListShow}"  @mousedown.right.stop="showMenu($event, true, -1)">
      <v-list subheader id="danmakuList" class="slimScrollbar">
        <v-subheader>
          弹幕列表
          <v-btn icon @click="clearDanmaku"><v-icon>mdi-delete</v-icon></v-btn>
        </v-subheader>
        <v-list-item v-for="item in danmakuList" :key="item.id" dense style="flex-wrap: wrap;" @mousedown.right.stop="showMenu($event, true, item)">
          <span v-if="item.log" style="color:skyblue">
            <v-icon small color="#66ccff">mdi-wrench</v-icon>
          </span>
          <span v-if="!item.log" style="color:skyblue">
            {{item.SenderUserName}}:
          </span>
          <span style="word-break: break-all;word-wrap: break-word;overflow: auto;">{{item.Content}}</span>
        </v-list-item>
        <v-menu v-model="menuDanmaku" :position-x="menuX" :position-y="menuY" absolute offset-y>
          <v-list min-width="150px" dark style="background-color: rgba(100,100,100,.8);">
            <v-list-item :disabled="currentDanmaku==null" @click="callCopy(currentDanmaku.Content)">复制{{currentDanmaku==null?'':currentDanmaku.Content}}</v-list-item>
            <v-list-item :disabled="currentDanmaku==null" @click="clickable">添加好友</v-list-item>
            <v-list-item :disabled="currentDanmaku==null" @click="sendDanmaku(currentDanmaku.Content)">复读</v-list-item>
            <v-list-item dense><v-divider></v-divider></v-list-item>
            <v-list-item @click="clearDanmaku">清空弹幕</v-list-item>
          </v-list>
        </v-menu>
        <div id="danmakuBottom"></div>
      </v-list>
    </div>
  </div>
</template>

<script>
import { loadLocalConfig, writeLocalConfig, readSessionStorage, copyText, addListener, removeListener } from '@/utils/tools'
import moment from 'moment'
import { Info, Confirm } from '@/utils/dialog'
import flvjs from 'flv.js'
import { getFonts } from 'font-list'
import { RestoreWindow } from '@/utils/windowsHelper'
import { DanmakuManager } from '@/danmakuManager/index'

export default {
  data () {
    return {
      user: null,
      server: Window.$WebSocket,
      screenFullFlag: false,
      thisWindow: null,
      preVol: 100,
      vols: 100,
      playStatus: true,
      loading: true,
      toolbarActive: false,
      danmakuInput: '',
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
      roomInstance: {},
      videoPlayer: null,
      catchFrameTimer: 0,
      danmakuListShow: false,
      danmakuList: [],
      menuDanmaku: false,
      maxDanmakuCount: 20,
      danmakuID: 0,
      currentDanmaku: {},
      danmakuSenderControlBoxShow: false,
      danmakuConfig: {
        FontFamily: '微软雅黑',
        Bold: true,
        FontSize: 20,
        Height: 75,
        Speed: 50,
        Position: '0',
        Color: '#ffffff',
        Opacity: 10
      },
      danmakuManager: null,
      danmakuBlockerItem: null,
      danmakuBlockerTmpWord: '',
      danmakuBlocker: {
        switch: true,
        keywords: [],
        users: []
      },
      fontList: [],
      holdHover: false,
      danmakuItemList: [],
      danmakuLastStep: 0,
      danmakuMaxStep: 26,
      danmakuColors: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#66ccff', '#7fffd4', '#00bfff', '#98fb98']
    }
  },
  watch: {
    danmakuBlocker: {
      handler (val) {
        writeLocalConfig('Config', 'DanmakuBlocker', this.danmakuBlocker)
      },
      deep: true
    },
    danmakuConfig: {
      handler (val) {
        writeLocalConfig('Config', 'DanmakuConfig', this.danmakuConfig)
      },
      deep: true
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
      if (this.danmakuCD !== 0 || !this.showDanmaku) return '#a9a9a9'
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
  async mounted () {
    this.thisWindow = require('@electron/remote').getCurrentWindow()
    this.thisWindow.show()
    this.user = await readSessionStorage('user')
    this.server.On('RoomEntered', this.handleRoomEnter)
    this.server.On('RoomVanish', this.handleRoomVanish)
    this.server.On('RoomClose', this.handleRoomClose)
    this.server.On('OnDanmaku', this.handleDanmaku)
    this.server.On('StreamerOffline', this.handleStreamerOffline)
    this.server.On('StreamerReConnect', this.handleStreamerReConnect)
    this.server.Emit('RoomEntered', { id: this.$route.query.id })
    this.videoContainer = document.querySelector('#video-container')
    // 重连后恢复房间状态
    this.server.OnOpen = () => {
      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    }

    let config = loadLocalConfig('Config', 'DanmakuBlocker')
    if (config) this.danmakuBlocker = config
    config = loadLocalConfig('Config', 'DanmakuConfig')
    if (config) this.danmakuConfig = config

    this.danmakuManager = new DanmakuManager(this.danmakuConfig)
    this.danmakuManager.bindContainer(this.$refs.danmakuContainer)
    const timeout = 1500
    setInterval(() => {
      if (!this.toolbarActive || this.danmakuInputFlag) return
      this.activeChangeCounter++
      if (this.activeChangeCounter === timeout) {
        this.toolbarActive = false
      }
    }, 100)
    this.showDanmaku = !!this.config.danmakuDefault
    getFonts({ disableQuoting: true }).then(fonts => {
      this.fontList = fonts.sort((a, b) => -1)
    }).catch(err => {
      console.log(err)
    })
    this.$vuetify.theme.dark = true
    this.ipcInit()
  },
  methods: {
    ipcInit () {
      this.thisWindow.on('resize', this.resizeHandle)
      addListener('player-play', () => {
        this.playStatusChange()
      })
      addListener('player-reload', () => {
        this.reconnect()
      })
      addListener('player-danmaku', () => {
        this.showDanmakuChange()
      })
      addListener('player-exit', () => {
        this.closeClient()
      })
    },
    ipcOff () {
      this.thisWindow.off('resize', this.resizeHandle)
      removeListener('player-play')
      removeListener('player-reload')
      removeListener('player-danmaku')
      removeListener('player-exit')
    },
    resizeHandle () {
      const ele = document.querySelector('#clientFrame')
      ele.style.height = `${this.thisWindow.getSize()[1] - 48 - 48}px`
      this.danmakuManager.reCalcMaxMove()
    },
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
      this.videoPlayer.unload()
      this.writeLog('主动放弃连接成功，开始重新请求连接')

      this.server.Emit('RoomEntered', { id: this.$route.query.id })
    },
    showMenu (e, isDanmakuMenu = false, danmaku = {}) {
      e.preventDefault()
      this.menu = false
      this.menuDanmaku = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.currentDanmaku = danmaku
      this.$nextTick(() => {
        if (isDanmakuMenu) {
          this.menuDanmaku = true
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
      this.logs.push({ id: this.logs.length, Content: `[${moment().format('yyyy-MM-DD HH:mm:ss')}] ${log}`, Time: new Date().getTime() })
      this.$nextTick(() => {
        document.querySelector('#logBottom').scrollIntoView()
      })
    },
    sendDanmaku ($event, content) {
      if (this.danmakuCD || !this.showDanmaku) return
      if (this.danmakuCDTimer) {
        clearInterval(this.danmakuCDTimer)
      }
      this.danmakuCD = 1
      this.danmakuCDTimer = setInterval(() => {
        if (this.danmakuCD === 0) return
        this.danmakuCD--
      }, 1000)
      const danmaku = content || this.danmakuInput
      this.server.On('SendDanmaku', data => {
        if (data.code === 200) {
          this.AddDanmaku(danmaku, this.danmakuConfig.Color, this.danmakuConfig.Position)
          if (!content) this.danmakuInput = ''
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('SendDanmaku', {
        content: danmaku,
        color: this.danmakuConfig.Color,
        position: this.danmakuConfig.Position
      })
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
        this.server.On('GetPullUrl', data => {
          if (data.code === 200) {
            this.writeLog('拉流地址获取成功')
            if (flvjs.isSupported()) {
              // this.createVideo(data.data.server + data.data.key)
              this.writeLog('播放器初始化成功，尝试播放...')
            }
          }
        })
        this.server.On('GetRoomDanmaku', data => {
          if (data.code === 200) {
            this.danmakuList = data.data
          }
        })

        this.writeLog('房间加入成功')
        this.roomInstance = data.data.roomInfo
        this.server.Emit('GetPullUrl', { type: 1 })
        this.server.Emit('GetRoomDanmaku', '')
      }
    },
    handleRoomVanish () {
      console.log('Receive room exit')
      Info('与房主断开连接，点击确定返回房间列表', '连接中断').then(() => {
        this.$router.go(-1)
      })
      this.videoPlayer.unload()
    },
    handleRoomClose () {
      console.log('Receive room exit')
      Info('与房主中断了连接，点击确定返回房间列表', '连接中断').then(() => {
        this.$router.go(-1)
      })
      this.videoPlayer.unload()
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
          this.server.Emit('GetPullUrl', { type: 1 })
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
    danmakuListToggle () {
      this.danmakuListShow = !this.danmakuListShow
    },
    AddDanmaku (content, color, position) {
      position = parseInt(position)
      if (!this.showDanmaku) return
      if (this.danmakuList.length > this.maxDanmakuCount) {
        this.danmakuList.splice(0, 1)
      }
      this.danmakuID++
      this.$nextTick(() => {
        document.querySelector('#danmakuBottom').scrollIntoView()
        for (let i = 0; i < 1; i++) {
          this.danmakuManager.createElement(content, color, position)
        }
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
      const keyword = this.danmakuBlockerTmpWord
      if (keyword.length === 0 || keyword.trim().length === 0) {
        this.snackbar.Error('关键词不能为空')
        return
      }
      if (this.danmakuBlocker.keywords.indexOf(keyword) !== -1) {
        this.snackbar.Error('关键词已存在')
        return
      }
      this.danmakuBlocker.keywords.push(keyword)
      this.danmakuBlockerTmpWord = ''
    },
    removeDanmakuBlocker (type, content) {
      switch (type) {
        case 'keywords':
          this.danmakuBlocker.keywords.splice(this.danmakuBlocker.keywords.indexOf(content), 1)
          break
        case 'users':
          this.danmakuBlocker.users.splice(this.danmakuBlocker.users.indexOf(content), 1)
          break
        default:
          break
      }
    },
    async clearDanmakuBlocker (type) {
      const res = await Confirm('是否清空此屏蔽项目', '确认')
      if (res) {
        switch (type) {
          case 'keywords':
            this.danmakuBlocker.keywords = []
            break
          case 'users':
            this.danmakuBlocker.users = []
            break
          default:
            break
        }
      }
    },
    callCopy (text) {
      copyText(text)
    },
    clearDanmaku () {
      this.danmakuList = []
    },
    handleDanmaku (data) {
      if (this.danmakuBlocker.keywords.length > 0) {
        for (let i = 0; i < this.danmakuBlocker.keywords.length; i++) {
          if (data.Content.indexOf(this.danmakuBlocker.keywords[i]) !== -1) {
            return
          }
        }
      }
      if (this.danmakuBlocker.users.length > 0) {
        for (let i = 0; i < this.danmakuBlocker.users.length; i++) {
          if (data.SenderUserID.indexOf(this.danmakuBlocker.users[i]) !== -1) {
            return
          }
        }
      }
      data.log = false
      this.danmakuList.push(data)
      if (data.SenderUserID !== this.user.Id) {
        this.AddDanmaku(data.Content, data.Color, data.Position)
      }
    },
    async closeClient () {
      const res = await Confirm('不看了吗？', '确认')
      if (res) {
        // this.thisWindow.hide()
        this.$router.go(-1)
      }
    },
    handleStreamerOffline () {
      this.snackbar.Info('主播断线')
      this.videoPlayer.unload()
    },
    handleStreamerReConnect () {
      this.server.Emit('RoomEntered', { id: this.$route.query.id })
      this.snackbar.Info('主播恢复连线，尝试重新连接...')
    }
  },
  beforeDestroy () {
    this.ipcOff()
    this.$vuetify.theme.dark = false
    this.server.Emit('Leave', {})
    this.danmakuManager.destroy()
    RestoreWindow()
  }
}
</script>
<style>
@keyframes danmakuAnime {
  from {right: 0;}
  to {right: 140%;}
}
.danmakuBase {
  position: absolute;
  user-select: none;
  pointer-events: none;
  /* 我超，为什么b站弹幕是用canvas画的 */
  /* -webkit-text-stroke: 1px white; */
  /* text-shadow: 1px 1px #fff; */
}
.danmakuMoveItem {
  right: 0px;
  transform: translate(100%);
}
.danmakuStillItem {
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

#danmakuList {
  overflow-y: scroll;
  height: 100%;
  width: 100%;
}
#danmakuListContainer {
  width: 25%;
  background: whitesmoke;
  transition: all .2s;
  z-index: 10;
}
.danmakuListHidden {
  width: 0 !important;
}
#danmakuListToggle {
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
#danmakuListToggle:hover {
  opacity: 1;
}
#danmakuListToggleArrow {
  width: 7px;
  height: 7px;
  border-left: 2px solid black;
  border-bottom: 2px solid black;
  transform: rotate(45deg);
  transition: all .2s;
}
.danmakuListToggleArrowReverse {
  transform: rotate(225deg) !important;
}
#danmakuSender {
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
/* .v-icon{
  color: white !important;
} */
#videoContainer{
  background-color: black;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
.videoToolBar{
  padding: 0 10px;
  width: 100%;
  position: absolute;
  display: flex;
  margin-bottom: 5px;
  transition: .2s all linear;
  z-index: 10;
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
#danmakuControlBox{
  width: 250px;
  bottom: 100%;
  transform: translate(-55%);
}
#danmakuSenderControlBox {
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
