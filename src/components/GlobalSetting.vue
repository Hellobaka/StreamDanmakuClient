<template>
  <v-card>
    <v-card-title>
      全局设置
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-container class="slimScrollbar" style="max-height: 500px; overflow-y: scroll; overflow-x: hidden;">
        <v-list subheader>
          <v-subheader>主题颜色设置</v-subheader>
          <v-list-item @click="colorPicker=!colorPicker">
            <v-list-item-content>
              <v-list-item-title>设置程序的大部分颜色</v-list-item-title>
              <v-list-item-subtitle>{{Config.themeColor}}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <div :style="`width: 20px; height: 20px; border-radius: 50%; background-color: ${Config.themeColor}`"></div>
            </v-list-item-action>
            <v-dialog v-model="colorPicker" max-width="290">
              <v-color-picker v-model="Config.themeColor"></v-color-picker>
              <v-container>
                <v-text-field v-model="Config.themeColor"></v-text-field>
                <v-btn :color="Config.themeColor" style="width: 100%" @click="Config.themeColor=globalThis.Application.Config.themeColor">重置</v-btn>
              </v-container>
            </v-dialog>
          </v-list-item>
          <v-subheader>弹幕设置</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch v-model="Config.danmakuDefault"></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>弹幕默认状态</v-list-item-title>
              <v-list-item-subtitle>每次进入直播间时是否开启弹幕</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch v-model="Config.danmakuRemember"></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>记忆弹幕状态</v-list-item-title>
              <v-list-item-subtitle>根据上次直播间内是否开启弹幕来决定下次进入直播间的弹幕状态，开启后将覆盖上面的选项</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>更新~</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>当前版本</v-list-item-title>
              <v-list-item-subtitle>{{currentVersion}}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
          </v-list-item>
          <v-list-item @click="checkUpdateDialog=true">
            <v-list-item-content>
              <v-list-item-title>检查更新</v-list-item-title>
              <v-list-item-subtitle>从服务器拉取更新</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
            <v-dialog v-model="checkUpdateDialog" max-width="400">
              <CheckUpdate @onDialogClose="checkUpdateDialog=false" v-if="checkUpdateDialog"></CheckUpdate>
            </v-dialog>
          </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="closeDialog" text>关闭</v-btn>
      <v-btn text color="primary" @click="save">保存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import CheckUpdate from './CheckUpdate.vue'
const { writeLocalConfig, loadLocalConfig, getAppVersion } = require('../utils/tools')
export default {
  name: 'GlobalSetting',
  components: {
    CheckUpdate
  },
  data () {
    return {
      Config: {
        themeColor: '#66CCFF',
        danmakuDefault: true,
        danmakuRemember: true
      },
      globalThis: global,
      colorPicker: false,
      color: '',
      currentVersion: '',
      checkUpdateDialog: false
    }
  },
  methods: {
    clickHandle () {},
    save () {
      for (const item in this.Config) {
        writeLocalConfig('Config', item, this.Config[item])
      }
      console.log(this.$vuetify.theme.themes.light.primary)
      this.$vuetify.theme.themes.light.primary = this.Config.themeColor
      this.closeDialog()
    },
    closeDialog () {
      this.$emit('onDialogClose', true)
      this.stopInput()
    }
  },
  mounted () {
    const config = loadLocalConfig('Config')
    if (config) this.Config = config
    this.currentVersion = getAppVersion()
  }
}
</script>

<style>

</style>
