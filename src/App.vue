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
      <v-avatar class="clickable" color="indigo" @click="userCenterOn = true">
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
    <v-dialog v-model="userCenterOn">
      <UserCenter @onDialogClose="userCenterOn=false"></UserCenter>
    </v-dialog>
    <v-dialog v-model="globalSettingOn">
      <GlobalSetting @onDialogClose="globalSettingOn=false"></GlobalSetting>
    </v-dialog>
  </v-app>
</template>

<script>
import UserCenter from './components/UserCenter.vue'
import GlobalSetting from './components/GlobalSetting.vue'
const { loadLocalConfig } = require('./utils/tools')
export default {
  name: 'App',
  components: {
    UserCenter,
    GlobalSetting
  },
  data: () => ({
    globalThis: global,
    ServerConnected: false,
    server: Window.$WebSocket,
    userCenterOn: false,
    globalSettingOn: false
  }),
  methods: {
    init () {
      // cnm
      setInterval(() => {
        this.ServerConnected = this.server.connection.readyState === 1
      }, 500)
    }
  },
  mounted () {
    global.Application = {}
    global.Application.Config = loadLocalConfig('Config')
    this.$vuetify.theme.themes.light.primary = global.Application.Config.themeColor
    this.$store.commit('loadConfig', { section: 'LoginConfig', payload: loadLocalConfig('LoginConfig') })
    console.log('Load Local Config Success.')
    this.init()
  }
}
</script>
<style lang="scss">
.clickable:hover{
  cursor: pointer;
}
</style>
