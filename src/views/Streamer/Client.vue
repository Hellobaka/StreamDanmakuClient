<template>
  <div style="display: flex;height:100%;" @mousemove="toolbarActiveChange" data-app="true">
    <div id="videoContainer" @contextmenu="showMenu">
      <div id="logs">
        <p v-for="log in logs" :key="log.time">{{log.content}}</p>
      </div>
      <video autoplay></video>
      <v-menu v-model="menu" :position-x="menuX" :position-y="menuY" absolute offset-y>
        <v-list dark style="background-color: rgba(100,100,100,.2);" ref="menuList">
          <v-list-item @click="playStatusChange">{{playStatus?'暂停': '播放'}}</v-list-item>
          <v-list-item @click="volClick">{{vols?'':'取消'}}静音</v-list-item>
          <v-list-item @click="clickHandle">视频统计信息</v-list-item>
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
            <v-btn v-on="on" v-bind="attrs" icon><v-icon>mdi-refresh</v-icon></v-btn>
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
                  <v-slider height="150px" vertical thumb-label v-model="vols" id="volController" :color="$vuetify.theme.themes.light.primary" track-color="rgba(100,100,100,.5)" :thumb-color="$vuetify.theme.themes.light.primary"></v-slider>
              </div>
            </v-fade-transition>
          </div>
        </v-hover>
        <v-spacer></v-spacer>
        <div id="danmukuSender">
          <input v-model="currentDanmuku" @keydown.enter="sendDanmuku" type="text" class="normalInput" @focus="inputOnFocus" @blur="inputOnBlur" ref="danmukuSender">
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
            <v-btn @click="showDanmuku=!showDanmuku" v-on="on" v-bind="attrs" icon><v-icon>{{danmukuSwitchIcon}}</v-icon></v-btn>
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
            <v-btn v-on="on" v-bind="attrs" icon><v-icon>mdi-fullscreen</v-icon></v-btn>
          </template>
          <span>全屏</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      preVol: 100,
      vols: 100,
      playStatus: true,
      loading: false,
      toolbarActive: false,
      currentDanmuku: '',
      showDanmuku: true,
      danmukuInputFlag: false,
      activeChangeCounter: 0,
      danmukuCD: 0,
      danmukuCDTimer: 0,
      menu: false,
      menuX: 0,
      menuY: 0,
      logs: []
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
    }
  },
  mounted () {
    const timeout = 1500
    setInterval(() => {
      if (!this.toolbarActive || this.danmukuInputFlag) return
      this.activeChangeCounter++
      if (this.activeChangeCounter === timeout) {
        this.toolbarActive = false
      }
    }, 100)
  },
  methods: {
    volClick () {
      if (this.vols !== 0) {
        this.preVol = this.vols
        this.vols = 0
      } else {
        this.vols = this.preVol
      }
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
      } else {
        this.playStatus = true
      }
    },
    writeLog (log) {
      this.logs.push({ content: log, time: new Date().getTime() })
    },
    sendDanmuku () {
      if (this.danmukuCD) return
      if (this.danmukuCDTimer) {
        clearInterval(this.danmukuCDTimer)
      }
      this.danmukuCD = 5
      this.danmukuCDTimer = setInterval(() => {
        if (this.danmukuCD === 0) return
        this.danmukuCD--
      }, 1000)
      this.writeLog(this.currentDanmuku)
      this.currentDanmuku = ''
    }
  }
}
</script>

<style scoped>
#danmukuSender {
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
  max-height: 500px;
  border-radius: 10px;
  width: 30%;
  min-width: 150px;
  color: white;
  /* background: rgba(100,100,100,.5); */
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
