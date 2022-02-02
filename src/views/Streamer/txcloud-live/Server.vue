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
    <v-main class="halfTransplant" ref="danmukuList">
      <v-menu v-model="menu" :position-x="menuX" :position-y="menuY" absolute offset-y>
        <v-list dark style="background-color: rgba(100,100,100,.8);">
          <v-list-item @click="callCopy(roomInstance.InviteCode)">复制邀请码</v-list-item>
          <v-list-item @click="callCopy(pushServer)">复制推流服务器 URL</v-list-item>
          <v-list-item @click="callCopy(pushKey)">复制推流密钥</v-list-item>
          <v-list-item @click="clearDanmuku">清空弹幕池</v-list-item>
        </v-list>
      </v-menu>
      <div @mousedown.right.stop="showMenu">
        <v-list :style="`background: transparent;overflow-y: scroll;height:${listHeight}px;`" id="danmukuList">
          <v-list-item v-for="item in danmukuList" :key="item.id" dense style="flex-wrap: wrap;" @mousedown.right.stop="showMenu($event, true)">
            <span v-if="item.log" style="color:skyblue">
              [{{timeFormat(item.time)}}]
            </span>
            <span style="word-break: break-all;word-wrap: break-word;overflow: auto;">{{item.content}}</span>
          </v-list-item>
        </v-list>
        <v-menu v-model="menuDanmuku" :position-x="menuX" :position-y="menuY" absolute offset-y>
          <v-list min-width="150px" dark style="background-color: rgba(100,100,100,.8);">
            <v-list-item @click="clickable">复制</v-list-item>
            <v-list-item @click="clickable">添加好友</v-list-item>
            <v-list-item @click="clickable">复读</v-list-item>
            <v-list-item dense><v-divider></v-divider></v-list-item>
            <v-list-item @click="clickable">禁言用户</v-list-item>
            <v-list-item @click="clickable">踢出</v-list-item>
          </v-list>
        </v-menu>
      </div>
      <div id="danmukuSender" style="display: flex;padding: 0 17px;">
        <input v-model="danmukuInput" @keydown.enter="sendDanmuku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmukuSender">
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="sendDanmuku" v-on="on" v-bind="attrs" :color="danmukuSenderColor" style="color: white;">发送弹幕</v-btn>
          </template>
          <span>发送弹幕</span>
        </v-tooltip>
      </div>
    </v-main>
    <v-footer ref="footer" class="halfTransplant" elevation="10">
      <div @mousedown.right.stop="showMenu" style="display:flex; align-items: center; width: 100%;">
        <span style="margin-right: 10px;">{{streamTime}}</span>
        <span style="margin-right: 10px;">房间内 {{onlineCount}} 人</span>
        <span style="margin-right: 10px;">弹幕: {{danmukuCount}} 条</span>
        <v-spacer></v-spacer>
        <v-btn @click="switchRoomPublic">{{roomPublicFlag?'终止':'开始'}}直播</v-btn>
      </div>
    </v-footer>
  </v-app>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { screen, Tray, Menu } from '@electron/remote'
import { loadLocalConfig, copyText } from '@/utils/tools'
import { Confirm } from '@/utils/dialog'
import moment from 'moment'

export default {
  data () {
    return {
      onlineCount: 0,
      roomInstance: {},
      thisWindow: null,
      topMost: false,
      ignoreMouse: false,
      serverDelay: 0,
      serverConnected: false,
      danmukuList: [],
      server: Window.$WebSocket,
      tray: null,
      listHeight: 459,
      headerHeight: 0,
      footerHeight: 0,
      danmukuHeight: 0,
      stateHandler: 0,
      menu: false,
      menuDanmuku: false,
      menuX: 0,
      menuY: 0,
      roomPublicFlag: false,
      pushServer: '',
      pushKey: '',
      startTime: 0,
      nowTime: 0,
      danmukuInput: '',
      danmukuInputFlag: false
    }
  },
  computed: {
    config: function () {
      return loadLocalConfig('Config')
    },
    danmukuCount: function () {
      return this.danmukuList.filter(x => !x.log).length
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
    danmukuSenderColor: function () {
      return this.$vuetify.theme.themes.light.primary
    }
  },
  beforeDestroy () {
    if (this.tray) this.tray.destroy()
  },
  beforeMount () {
    var momentDurationFormatSetup = require('moment-duration-format')
    momentDurationFormatSetup(moment)
  },
  mounted () {
    setInterval(() => {
      this.nowTime = new Date().getTime()
    }, 1000)
    this.$vuetify.theme.dark = true
    this.server.TempGetInfoCallback = (data) => {
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
      this.server.On('GetPushUrl', data => {
        this.writeLog('初始化完成，请使用OBS进行推流')
        this.pushServer = data.data.server
        this.pushKey = data.data.key
        this.writeLog(`推流地址：${this.pushServer}`)
        this.writeLog(`推流密钥：${this.pushKey}`)
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
    }
  },
  methods: {
    timeFormat (time) {
      return moment(time).format('yyyy-MM-DD HH:mm:ss')
    },
    writeLog (content) {
      this.danmukuList.push({ id: this.danmukuList.length, content: `${content}`, time: new Date().getTime(), log: true })
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
        // this.serverDelay = this.serverConnected ? this.server.delay : '∞'
      }, 100)
      const winW = screen.getPrimaryDisplay().workAreaSize.width
      const winH = screen.getPrimaryDisplay().workAreaSize.height
      this.thisWindow.setPosition(parseInt(winW * 0.75), parseInt(winH * 0.15))

      this.thisWindow.on('resize', () => {
        const totalHeight = document.body.clientHeight
        if (this.headerHeight === 0) {
          this.headerHeight = this.$refs.header.$el.offsetHeight
          this.footerHeight = this.$refs.footer.$el.offsetHeight
          this.danmukuHeight = document.querySelector('#danmukuSender').offsetHeight
        }
        this.listHeight = totalHeight - this.headerHeight - this.footerHeight - this.danmukuHeight
        console.log(this.listHeight)
      })
      this.thisWindow.on('blur', () => {
        this.$refs.danmukuList.$el.classList.remove('Transplant07')
        this.$refs.danmukuList.$el.classList.add('halfTransplant')
        this.$refs.footer.$el.classList.remove('Transplant08')
        this.$refs.footer.$el.classList.add('halfTransplant')
      })
      this.thisWindow.on('focus', () => {
        this.$refs.danmukuList.$el.classList.remove('halfTransplant')
        this.$refs.danmukuList.$el.classList.add('Transplant07')
        this.$refs.footer.$el.classList.remove('halfTransplant')
        this.$refs.footer.$el.classList.add('Transplant08')
      })
      this.server.On('OnLeave', this.OnLeave)
      this.server.On('OnEnter', this.OnEnter)
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
        if (res) {
          this.danmukuList = []
          this.server.On('SwitchStream', data => {
            // start
            this.startTime = new Date().getTime()
          })
          this.server.Emit('SwitchStream', { flag: true })
        }
      } else {
        const res = await Confirm('点击确定将关闭房间', '提示')
        if (res) {
          this.danmukuList = []
          this.server.On('SwitchStream', data => {
            // start
          })
          this.server.Emit('SwitchStream', { flag: false })
        }
      }
    },
    showMenu (e, isDanmuku = false) {
      e.preventDefault()
      this.menu = false
      this.menuDanmuku = false
      this.menuX = e.clientX
      this.menuY = e.clientY
      this.$nextTick(() => {
        if (isDanmuku) { this.menuDanmuku = true } else { this.menu = true }
      })
    },
    clickable () {},
    clearDanmuku () {
      this.danmukuList = []
    },
    callCopy (text) {
      copyText(text)
    },
    sendDanmuku () {
      if (this.danmukuInput === '') {
        // this.snackbar.Error('请输入弹幕内容')
        return
      }
      this.danmukuList.push({ id: this.danmukuList.length, content: `${this.danmukuInput}`, time: new Date().getTime(), log: false })
      this.danmukuInput = ''
    },
    inputOnFocus () {
      this.danmukuInputFlag = true
      this.$refs.danmukuSender.style.boxShadow = `0px 0px 20px 0px ${this.$vuetify.theme.themes.light.primary}`
    },
    inputOnBlur () {
      this.danmukuInputFlag = false
      this.$refs.danmukuSender.style.boxShadow = `0px 0px 0px 0px ${this.$vuetify.theme.themes.light.primary}`
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
