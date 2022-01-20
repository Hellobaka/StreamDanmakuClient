<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-icon
          slot="icon"
          size="36"
          @click="$router.go(-1)"
        >
          mdi-arrow-left
        </v-icon>
      </div>
      <h3>{{$route.name}}</h3>
      <v-spacer></v-spacer>
      <v-avatar class="clickable" @click="globalSettingOn = true">
        <v-icon>
          mdi-cog
        </v-icon>
      </v-avatar>
      <v-avatar class="clickable" color="indigo" @click="OpenUserCenter">
        <v-icon dark>
          mdi-account-circle
        </v-icon>
      </v-avatar>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <v-overlay :value="!ServerConnected">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <span style="margin-left: 1vw">与服务器建立连接中...</span>
    </v-overlay>
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
import GlobalSetting from '../components/GlobalSetting.vue'
const { readSessionStorage, routerJump } = require('../utils/tools')
const { Confirm } = require('../utils/dialog')

export default {
  name: 'ToolBar',
  components: {
    UserCenter,
    GlobalSetting
  },
  data: () => ({
    globalThis: global,
    ServerConnected: false,
    server: Window.$WebSocket,
    userCenterOn: false,
    globalSettingOn: false,
    config: null
  }),
  methods: {
    init () {
      // cnm
      setInterval(() => {
        this.ServerConnected = this.server.connection.readyState === 1
      }, 500)
    },
    async OpenUserCenter () {
      if (await readSessionStorage('LoginFlag')) this.userCenterOn = true
      else {
        const res = await Confirm('暂未登录，是否前往登录页面？', '未登录')
        if (res) {
          routerJump(this.$router, './', true)
        }
      }
    }
  },
  async mounted () {
    this.$vuetify.theme.themes.light.primary = '#3f51b5'
    // await writeSessionStorage('LoginFlag', false)
    // await writeSessionStorage('user', null)
    // this.config = loadLocalConfig('Config')
    // // writeSessionStorage('Config', this.config)
    // if (this.config && this.config.themeColor) {
    //   this.$vuetify.theme.themes.light.primary = this.config.themeColor
    // }
    // console.log('Load Local Config Success.')
    this.init()
  }
}
</script>
<style lang="scss">
.clickable:hover{
  cursor: pointer;
}
</style>
