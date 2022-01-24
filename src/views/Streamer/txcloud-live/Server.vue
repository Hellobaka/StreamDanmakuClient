<template>
  <v-app id="frameMain">
    <v-app-bar app dense class="draggable" id="toolBar" ref="header">
      <span style="font-size: 15px;">TRTC模式 房间: {{roomInstance.RoomID}} - {{roomInstance.InviteCode}}
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
        <v-list-item v-for="item in danmukuList" :key="item.id" dense style="flex-wrap: wrap;">
          <span v-if="item.log" style="color:skyblue">
            [{{timeFormat(item.time)}}]
          </span>
          <span style="word-break: break-all;word-wrap: break-word;overflow: auto;">{{item.content}}</span>
        </v-list-item>
      </v-list>
    </v-main>
    <v-footer ref="footer" style="display:flex; padding:10px;" class="halfTransplant" elevation="10">
      <span style="margin-right: 10px;">{{onlineCount}}人</span>
      <span style="margin-right: 10px;">弹幕: {{danmukuCount}}条</span>
      <span style="margin-right: 10px;">网络上行: {{networkUpload}}</span>
      <span>码率: {{bitRate}}</span>
      <v-spacer></v-spacer>
      <v-btn @click="switchRoomPublic">{{roomPublicFlag?'终止':'开始'}}直播</v-btn>
    </v-footer>
  </v-app>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { screen, Tray, Menu } from '@electron/remote'
import { loadLocalConfig } from '@/utils/tools'
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
      totalUpload: 0,
      bitRate: 0,
      server: Window.$WebSocket,
      tray: null,
      listHeight: 496,
      headerHeight: 0,
      footerHeight: 0,
      stateHandler: 0,
      timestampPrev: 0,
      roomPublicFlag: false
    }
  },
  computed: {
    config: function () {
      return loadLocalConfig('Config')
    },
    danmukuCount: function () {
      return this.danmukuList.filter(x => !x.log).length
    },
    networkUpload: function () {
      return this.totalUpload === 0 ? this.speedParse(this.bitRate) : this.speedParse(this.totalUpload)
    }
  },
  beforeDestroy () {
    if (this.tray) this.tray.destroy()
  },
  mounted () {
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
        this.writeLog(`推流地址：${data.data.server}`)
        this.writeLog(`推流密钥：${data.data.key}`)
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
        }
        this.listHeight = totalHeight - this.headerHeight - this.footerHeight
      })
      this.server.On('Leave', this.sendLeave)

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
    speedParse (speed) {
      if (speed < 1024) {
        return `${speed} KB/s`
      } else if (speed > 1024 && speed < 1024 * 1024) {
        return `${Math.round(speed / 1024 * 100) / 100} MB/s`
      } else {
        return `${Math.round(speed / 1024 / 1024 * 100) / 100} GB/s`
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
    sendLeave (data) {
      console.log('receive leave', data)
      if (this.RTCConnectionList.has(data.from)) {
        const PeerConnection = this.RTCConnectionList.get(data.from)
        PeerConnection.close()
        PeerConnection.ontrack = null
        PeerConnection.onicecandidate = null
        this.RTCConnectionList.delete(data.from)
        this.onlineCount--
      } else {
        // ?
      }
    },
    async switchRoomPublic () {
      if (!this.roomPublicFlag) {
        const res = await Confirm('点击确定将开始直播', '提示')
        if (res) {
          this.danmukuList = []
          this.server.On('SwitchStream', data => {
            // start
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
