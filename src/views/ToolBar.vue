<template>
  <v-app style="border-radius: 10px;">
    <v-app-bar dense dark app color="primary" class="draggable" style="border-radius: 10px 10px 0 0;">
      <div class="d-flex align-center">
        <v-icon
          class="undraggable"
          slot="icon"
          size="36"
          @click="$router.go(-1)"
        >
          mdi-arrow-left
        </v-icon>
        <h3>{{$route.name}}</h3>
      </div>
      <v-spacer></v-spacer>
      <v-btn class="undraggable" icon @click="minimize"><v-icon>mdi-minus</v-icon></v-btn>
      <v-btn class="undraggable" icon @click="closeApplication"><v-icon>mdi-close</v-icon></v-btn>
    </v-app-bar>

    <v-main>
      <v-toolbar dense elevation="2" style="z-index: 2;position: sticky;top: 48px;">
        <v-menu offset-y min-width="100px">
          <template v-slot:activator="{ on, attrs }">
            <v-btn plain v-bind="attrs" v-on="on">
              页面
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="$router.go(-1)"><v-list-item-title>上一页</v-list-item-title></v-list-item>
            <v-list-item @click="clickable" disabled><v-divider></v-divider></v-list-item>
            <v-list-item @click="callLogout"><v-list-item-title>注销</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>
        <v-menu offset-y min-width="100px" v-if="$route.path=='/roomList'">
          <template v-slot:activator="{ on, attrs }">
            <v-btn plain v-bind="attrs" v-on="on">
              房间
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="callListener('roomList-join')"><v-list-item-title>加入房间</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('roomList-reload')"><v-list-item-title>刷新列表</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('roomList-create')"><v-list-item-title>创建房间</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('roomList-top')"><v-list-item-title>回到顶部</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>
        <v-menu offset-y min-width="100px" v-if="$route.path=='/txcloud-live/client'">
          <template v-slot:activator="{ on, attrs }">
            <v-btn plain v-bind="attrs" v-on="on">
              播放器
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="callListener('player-play')"><v-list-item-title>播放/停止</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('player-reload')"><v-list-item-title>重新载入</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('player-danmaku')"><v-list-item-title>打开/关闭弹幕</v-list-item-title></v-list-item>
            <v-list-item @click="callListener('player-exit')"><v-list-item-title>退出直播间</v-list-item-title></v-list-item>
          </v-list>
        </v-menu>
        <v-spacer></v-spacer>
        <v-btn icon @click="globalSettingOn = true">
          <v-icon>
            mdi-cog
          </v-icon>
        </v-btn>
        <v-menu v-model="showFriendList" offset-y offset-x :close-on-click="false" :close-on-content-click="false">
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon color="primary" v-bind="attrs" v-on="on">
              <v-badge
                :content="notificationCount"
                :value="notificationCount"
                color="primary"
                overlap
              >
                <v-icon>
                  mdi-account-multiple
                </v-icon>
              </v-badge>
            </v-btn>
          </template>
          <FriendList v-if="showFriendList" @onDialogClose="showFriendList=false"></FriendList>
        </v-menu>
        <v-btn icon color="primary" @click="OpenUserCenter">
          <v-icon dark>
            mdi-account-circle
          </v-icon>
        </v-btn>
      </v-toolbar>

      <router-view />
    </v-main>
    <v-footer style="border-radius: 0 0 10px 10px;">
      <div style="width:15px; height:15px; border-radius:50%; border: 1px solid gray; margin-right: 5px;" v-bind:class="{connected: ServerConnected, disconnected: !ServerConnected}"></div>
      <div style="user-select: none;">{{ServerConnected?'已连接':'正在连接...'}}</div>
    </v-footer>
    <v-dialog v-model="userCenterOn" @click:outside="userCenterOn=false" persistent>
      <UserCenter @onDialogClose="userCenterOn=false" v-if="userCenterOn"></UserCenter>
    </v-dialog>
    <v-dialog v-model="globalSettingOn">
      <GlobalSetting @onDialogClose="globalSettingOn=false" v-if="globalSettingOn"></GlobalSetting>
    </v-dialog>
  </v-app>
</template>

<script>
import UserCenter from '../components/UserCenter.vue'
import FriendList from '../components/FriendList.vue'
import GlobalSetting from '../components/GlobalSetting.vue'
const { readSessionStorage, emit, logout, addListener } = require('../utils/tools')
const { Confirm } = require('../utils/dialog')

export default {
  name: 'ToolBar',
  components: {
    UserCenter,
    GlobalSetting,
    FriendList
  },
  data: () => ({
    globalThis: global,
    ServerConnected: false,
    server: Window.$WebSocket,
    userCenterOn: false,
    globalSettingOn: false,
    config: null,
    showFriendList: false,
    notificationCount: 0
  }),
  methods: {
    async callLogout () {
      const res = await Confirm('确认要注销吗？', '注销提醒')
      if (res) {
        logout(this.$router)
      }
    },
    init () {
      // cnm
      setInterval(() => {
        this.ServerConnected = this.server.connection.readyState === 1
      }, 500)
    },
    async OpenUserCenter () {
      if (readSessionStorage('user')) this.userCenterOn = true
      else {
        const res = await Confirm('暂未登录，是否前往登录页面？', '未登录')
        if (res) {
          logout(this.$router)
        }
      }
    },
    clickable () {},
    minimize () {
      require('@electron/remote').getCurrentWindow().minimize()
    },
    async closeApplication () {
      const res = await Confirm('确定要退出吗？', '确认')
      if (res) {
        require('@electron/remote').app.exit()
      }
    },
    callListener (event) {
      emit(event)
    },
    fetchRequestCount () {
      this.server.On('GetFriendRequestCount', data => {
        if (data.code === 200) {
          emit('notification-count', data.data)
          this.notificationCount = data.data
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetFriendRequestCount')
    }
  },
  mounted () {
    this.server.On('OnFriendRequest', this.fetchRequestCount)
    this.init()
    addListener('notification-count', (count) => {
      this.notificationCount = count
    })
  }
}
</script>
<style lang="scss">
.clickable:hover{
  cursor: pointer;
}
</style>
<style scoped>
.connected {
  background: green;
}
.disconnected {
  background: red;
}
</style>
