<template>
  <v-app id="frameMain">
    <v-app-bar app dense class="draggable" id="toolBar" ref="header">
      <span style="font-size: 15px;" @mousedown="callCopy(roomInstance.InviteCode)">房间邀请码: {{roomInstance.InviteCode}}
        <div :style="`margin-left: 10px;float:right;width: 20px; height: 20px; border: 1px solid white; border-radius: 50%; background-color: ${serverConnected?'green':'coral'}`"></div>
      </span>
      <v-spacer></v-spacer>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="copyInviteCode" icon @click="callCopy(roomInstance.InviteCode)" v-bind="attrs" v-on="on"><v-icon>mdi-clipboard-text</v-icon></v-btn>
        </template>
        <span>复制邀请码</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="copyInviteCode" icon @click="muteList = true" v-bind="attrs" v-on="on"><v-icon>mdi-account-off</v-icon></v-btn>
        </template>
        <span>管理禁言列表</span>
        <v-dialog v-model="muteList">
          <MuteList @onDialogClose="muteList=false" v-if="muteList"></MuteList>
        </v-dialog>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="setTransplant" icon @click="setIgnoreMouse(!ignoreMouse)" v-bind="attrs" v-on="on" v-bind:style="ignoreMouse?'background:rgba(255,255,255,.2)':''"><v-icon>mdi-lock</v-icon></v-btn>
        </template>
        <span>窗口穿透</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn ref="setTop" icon @click="setTopMost(!topMost)" v-bind="attrs" v-on="on" v-bind:style="topMost?'background:rgba(255,255,255,.2)':''"><v-icon>mdi-dock-top</v-icon></v-btn>
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
    <v-main class="Transplant07" ref="danmakuList">
      <v-menu v-model="menu" :position-x="menuX" :position-y="menuY" absolute offset-y>
        <v-list dark style="background-color: rgba(100,100,100,.8);">
          <v-list-item @click="callCopy(roomInstance.InviteCode)">复制邀请码</v-list-item>
          <v-list-item @click="callCopy(pushServer)">复制推流服务器 URL</v-list-item>
          <v-list-item @click="callCopy(pushKey)">复制推流密钥</v-list-item>
          <v-list-item @click="clearDanmaku">清空弹幕池</v-list-item>
        </v-list>
      </v-menu>
      <div @mousedown.right.stop="showMenu">
        <v-list :style="`background: transparent;overflow-y: scroll;height:${listHeight}px;`" id="danmakuList">
          <v-list-item v-for="item in danmakuList" style="display: block;" :key="item.id" dense @mousedown.right.stop="showMenu($event, true, item)">
            <span v-if="item.log || item.SenderUserName === 'Admin'" style="color:skyblue">
              <v-icon small color="#66ccff">mdi-wrench</v-icon>
            </span>
            <span v-if="item.SenderUserName === roomInstance.CreatorName" style="color:skyblue">
              <div style="color: #66ccff; border-radius: 5px; border: 1px solid #66ccff; padding: 0 5px;display: inline;">UP</div>
            </span>
            <span v-if="!item.log" style="color:skyblue">
              {{item.SenderUserName}} :
            </span>
            <span style="word-break: break-all;word-wrap: break-word;overflow: auto;">{{item.Content}}</span>
            <v-menu v-if="!item.log" v-model="menuDanmaku" :position-x="menuX" :position-y="menuY" absolute offset-y>
              <v-list min-width="150px" dark style="background-color: rgba(100,100,100,.8);">
                <v-list-item @click="callCopy(item.content)">复制</v-list-item>
                <v-list-item @click="clickable">添加好友</v-list-item>
                <v-list-item @click="sendDanmaku(item.content)">复读</v-list-item>
                <v-list-item dense><v-divider></v-divider></v-list-item>
                <v-list-item @click="muteUser(item)">切换用户禁言</v-list-item>
                <v-list-item @click="clickable">踢出</v-list-item>
              </v-list>
            </v-menu>
          </v-list-item>
          <div id="danmakuBottom"></div>
        </v-list>
      </div>
      <div id="danmakuSender" style="display: flex;padding: 0 17px;">
        <input v-model="danmakuInput" @keydown.enter="sendDanmaku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmakuSender">
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="sendDanmaku" v-on="on" v-bind="attrs" :color="danmakuSenderColor" style="color: white;">发送弹幕</v-btn>
          </template>
          <span>发送弹幕</span>
        </v-tooltip>
      </div>
      <div id="video_container" style="width:100%; height:auto;display:none;"></div>
    </v-main>
    <v-footer ref="footer" class="Transplant08" elevation="10">
      <div @mousedown.right.stop="showMenu" style="display:flex; align-items: center; width: 100%;">
        <span style="margin-right: 10px;">{{streamTime}}</span>
        <span style="margin-right: 10px;">房间内 {{onlineCount}} 人</span>
        <span style="margin-right: 10px;">弹幕: {{danmakuCount}} 条</span>
        <v-spacer></v-spacer>
        <v-btn @click="switchRoomPublic">{{roomPublicFlag?'终止':'开始'}}直播</v-btn>
      </div>
    </v-footer>
  </v-app>
</template>

<script>
import { screen, Menu } from '@electron/remote'
import MuteList from '@/components/MuteList.vue'
import { loadLocalConfig, copyText } from '@/utils/tools'
import { Info, Confirm } from '@/utils/dialog'
import moment from 'moment'
import { RestoreWindow } from '../../utils/windowsHelper'
const { TcPlayer } = require('@/utils/TcPlayer-module-2.4.1.js')

export default {
  components: {
    MuteList
  },
  data () {
    return {
      onlineCount: 0,
      roomInstance: {},
      thisWindow: null,
      topMost: false,
      ignoreMouse: false,
      serverDelay: 0,
      serverConnected: false,
      danmakuList: [],
      server: Window.$WebSocket,
      tray: null,
      listHeight: 459,
      headerHeight: 0,
      footerHeight: 0,
      danmakuHeight: 0,
      stateHandler: 0,
      menu: false,
      menuDanmaku: false,
      menuX: 0,
      menuY: 0,
      roomPublicFlag: false,
      pushServer: '',
      pushKey: '',
      startTime: 0,
      nowTime: 0,
      currentDanmaku: {},
      danmakuInput: '',
      danmakuColor: '#FFFFFF',
      danmakuPosition: '0',
      danmakuInputFlag: false,
      isMuted: false,
      player: null,
      captureTimer: 0,
      videoContainer: null,
      muteList: false
    }
  },
  computed: {
    config: function () {
      return loadLocalConfig('Config')
    },
    danmakuCount: function () {
      return this.danmakuList.filter(x => !x.log).length
    },
    streamTime: function () {
      if (this.startTime === 0) {
        return '00:00'
      }
      const diff = this.nowTime - this.startTime
      if (diff < 60 * 1000) {
        return moment.duration(diff).format('00:ss')
      } else if (diff < 3600 * 1000) {
        return moment.duration(diff).format('mm:ss')
      } else {
        return moment.duration(diff).format('HH:mm:ss')
      }
    },
    danmakuSenderColor: function () {
      return this.$vuetify.theme.themes.light.primary
    }
  },
  beforeDestroy () {
    clearInterval(this.captureTimer)

    this.thisWindow.off('resize', this.resizeHandler)
    this.thisWindow.off('blur', this.blurHandler)
    this.thisWindow.off('focus', this.focusHandler)
    this.setIgnoreMouse(false)
    this.setTopMost(false)
    if (this.tray) this.tray.destroy()
    this.$vuetify.theme.dark = false
    this.server.Emit('Leave', {})
    RestoreWindow()
  },
  beforeMount () {
    var momentDurationFormatSetup = require('moment-duration-format')
    momentDurationFormatSetup(moment)
  },
  mounted () {
    this.thisWindow = require('@electron/remote').getCurrentWindow()
    this.init()
    this.thisWindow.show()
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
    this.server.On('GetPushUrl', data => {
      this.pushServer = data.data.server
      this.pushKey = data.data.key

      if (this.$route.query.resume) {
        this.startTime = new Date().getTime()
      } else {
        this.writeLog('初始化完成，请进行推流之后点击下方的开始直播以公开房间')
        this.writeLog(`推流地址：${this.pushServer}`)
        this.writeLog(`推流密钥：${this.pushKey}`)
      }
    })
    this.server.On('RoomInfo', data => {
      if (data.code !== 200) {
        this.snackbar.Error(data.msg)
      } else {
        this.roomInstance = data.data.roomInfo
        this.server.Emit('GetPushUrl', '')
      }
    })
    this.server.Emit('RoomInfo', '')
    this.server.On('OnDanmaku', this.handleDanmaku)
    this.server.On('OnLeave', this.OnLeave)
    this.server.On('OnEnter', this.OnEnter)
    this.server.On('Admin_CallRoomDestroy', this.handleAdminCutStream)
    // 重连后恢复房间状态
    this.server.OnOpen = () => {
      this.server.On('ResumeRoom', data => {
        if (data.isSuccess) {
          this.server.Emit('RoomInfo', '')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('ResumeRoom', '')
    }
    setInterval(() => {
      this.nowTime = new Date().getTime()
    }, 1000)
    this.$vuetify.theme.dark = true
  },
  methods: {
    muteUser (item) {
      this.server.On('MuteUser', data => {
        if (data.code === 200) {
          const arr = data.data
          if (arr.includes(item.SenderUserID)) this.writeLog('已禁言用户' + item.SenderUserName)
          else this.writeLog('已解除用户' + item.SenderUserName + '禁言')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('MuteUser', { id: [item.SenderUserID] })
    },
    initCapturer () {
      this.server.On('GetPullUrl', data => {
        if (data.code !== 200) {
          this.snackbar.Error(data.msg)
        } else {
          this.player = new TcPlayer('video_container', {
            flv: data.data.server + data.data.key,
            h5_flv: true,
            volume: 0,
            width: '100%',
            height: 'auto',
            listener: (msg) => {
              if (msg.type === 'load') {
                this.player.play()
              } else if (msg.type === 'loadedmetadata') {
                setTimeout(() => {
                  this.captureImage()
                  this.player.destroy()
                }, 1000)
              }
            }
          })
        }
      })
      this.server.Emit('GetPullUrl', '')
    },
    captureImage () {
      this.videoContainer = document.querySelector('#video_container>.vcp-player>video')
      var canvas = document.createElement('canvas')
      canvas.width = this.videoContainer.videoWidth
      canvas.height = this.videoContainer.videoHeight
      canvas.getContext('2d')
        .drawImage(this.videoContainer, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        const a = new FileReader()
        a.onload = (e) => {
          this.uploadCapture(e.target.result)
        }
        try {
          a.readAsDataURL(blob)
        } catch {
          console.log(blob)
        }
      })
    },
    uploadCapture (base64) {
      this.server.Emit('UploadCapture', {
        base64
      })
    },
    handleDanmaku (data) {
      data.id = this.danmakuList.length
      data.log = false
      this.danmakuList.push(data)
      this.$nextTick(() => { document.querySelector('#danmakuBottom').scrollIntoView() })
    },
    timeFormat (time) {
      return moment(time).format('HH:mm:ss')
    },
    writeLog (content) {
      this.danmakuList.push({ id: this.danmakuList.length, Content: `${content}`, Time: new Date().getTime(), log: true })
    },
    updateMenu () {
      // this.tray.setToolTip('vue-cli-electron')
      // this.tray.setContextMenu(this.genMenuByTemplate())
    },
    genMenuByTemplate () {
      return Menu.buildFromTemplate([
        {
          label: '窗口穿透',
          type: 'checkbox',
          click: () => {
            this.setIgnoreMouse(!this.ignoreMouse)
          },
          checked: this.ignoreMouse
        },
        {
          label: '窗口置顶',
          type: 'checkbox',
          click: () => {
            this.setTopMost(!this.topMost)
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
        // this.serverDelay = this.serverConnected ? this.server.delay : '∞'
      }, 100)
      const winW = screen.getPrimaryDisplay().workAreaSize.width
      const winH = screen.getPrimaryDisplay().workAreaSize.height
      this.thisWindow.setPosition(parseInt(winW * 0.75), parseInt(winH * 0.15))

      this.thisWindow.on('resize', this.resizeHandler)
      this.thisWindow.on('blur', this.blurHandler)
      this.thisWindow.on('focus', this.focusHandler)
    },
    resizeHandler () {
      const totalHeight = document.body.clientHeight
      if (this.headerHeight === 0) {
        this.headerHeight = this.$refs.header.$el.offsetHeight
        this.footerHeight = this.$refs.footer.$el.offsetHeight
        this.danmakuHeight = document.querySelector('#danmakuSender').offsetHeight
      }
      this.listHeight = totalHeight - this.headerHeight - this.footerHeight - this.danmakuHeight
    },
    blurHandler () {
      this.$refs.danmakuList.$el.classList.remove('Transplant07')
      this.$refs.danmakuList.$el.classList.add('halfTransplant')
      this.$refs.footer.$el.classList.remove('Transplant08')
      this.$refs.footer.$el.classList.add('halfTransplant')
    },
    focusHandler () {
      this.$refs.danmakuList.$el.classList.remove('halfTransplant')
      this.$refs.danmakuList.$el.classList.add('Transplant07')
      this.$refs.footer.$el.classList.remove('halfTransplant')
      this.$refs.footer.$el.classList.add('Transplant08')
    },
    async closeWindow () {
      const res = await Confirm('确认要结束推流吗？', '提醒')
      if (res) {
        if (this.tray) this.tray.destroy()
        this.$router.go(-1)
      }
    },
    setTopMost (flag) {
      this.topMost = flag
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
    setIgnoreMouse (flag) {
      this.ignoreMouse = flag
      this.thisWindow.setIgnoreMouseEvents(this.ignoreMouse, { forward: true })
      this.updateMenu()
    },
    OnLeave (data) {
      console.log('receive leave', data)
      this.onlineCount--
    },
    OnEnter (data) {
      console.log('receive enter', data)
      this.onlineCount++
    },
    async switchRoomPublic () {
      if (!this.roomPublicFlag) {
        const res = await Confirm('点击确定将开始直播', '提示')
        console.log(res)
        if (res) {
          this.danmakuList = []
          this.server.On('SwitchStream', data => {
            // start
            this.startTime = new Date().getTime()
            // this.captureTimer = setInterval(() => {
            //   this.initCapturer()
            // }, 10 * 1000)
          })
          this.server.Emit('SwitchStream', { flag: true })
        }
      } else {
        const res = await Confirm('点击确定将关闭房间', '提示')
        if (res) {
          this.danmakuList = []
          this.server.On('SwitchStream', data => {
            clearInterval(this.captureTimer)
          })
          this.server.Emit('SwitchStream', { flag: false })
        }
      }
    },
    showMenu (e, isDanmaku = false, danmaku = {}) {
      e.preventDefault()
      this.currentDanmaku = danmaku
      this.menu = false
      this.menuDanmaku = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.$nextTick(() => {
        if (isDanmaku) { this.menuDanmaku = true } else { this.menu = true }
      })
    },
    clickable () {},
    clearDanmaku () {
      this.danmakuList = []
    },
    callCopy (text) {
      copyText(text)
    },
    sendDanmaku ($event, content) {
      if (this.danmakuInput === '' || this.danmakuInput.trim() === '') {
        // this.snackbar.Error('请输入弹幕内容')
        return
      }
      const danmaku = content || this.danmakuInput
      this.server.On('SendDanmaku', data => {
        console.log(data)
        if (data.code === 200) {
          if (!content) this.danmakuInput = ''
          document.querySelector('#danmakuBottom').scrollIntoView()
        } else {
          if (data.code === 505) {
            this.isMuted = true
          }
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('SendDanmaku', {
        content: danmaku,
        color: this.danmakuColor,
        position: this.danmakuPosition
      })
    },
    inputOnFocus () {
      this.danmakuInputFlag = true
      this.$refs.danmakuSender.style.boxShadow = `0px 0px 20px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    inputOnBlur () {
      this.danmakuInputFlag = false
      this.$refs.danmakuSender.style.boxShadow = `0px 0px 0px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    handleAdminCutStream (data) {
      Info('直播已被切断，点击确认返回房间列表', data).finally(() => {
        this.$router.go(-1)
      })
    }
  }
}
</script>

<style scoped>
.draggable {
  /* cursor: move; 无法与拖拽属性共存 */
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
.Transplant07{
  background-color: rgba(100,100,100,.8) !important;
}
.Transplant08{
  background-color: rgba(100,100,100,.8) !important;
}
#frameMain {
  background:unset !important;
}
button{
  -webkit-app-region: no-drag;
}
#danmakuList::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
#danmakuList::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : skyblue;
}
#danmakuList::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
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
</style>
