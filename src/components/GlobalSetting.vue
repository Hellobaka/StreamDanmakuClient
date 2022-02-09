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
      <v-container>
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
          <v-subheader>画质设置</v-subheader>
          <v-list-group no-action>
            <template v-slot:activator>
              <v-list-item style="padding-left: 0;">
                <v-list-item-content>
                  <v-list-item-title>直播允许最高画质</v-list-item-title>
                  <v-list-item-subtitle>{{Config.bitrate_Stream}} KB/s @{{Config.framerate_Stream}}fps</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
              <v-list-item>
                  <v-list-item-title>码率: {{Config.bitrate_Stream}} KB/s<v-slider v-model="Config.bitrate_Stream" min="2000" max="20000"></v-slider></v-list-item-title>
              </v-list-item>
              <v-list-item>
                  <v-list-item-title>帧数: {{Config.framerate_Stream}} fps<v-slider v-model="Config.framerate_Stream" min="10" max="144"></v-slider></v-list-item-title>
              </v-list-item>
          </v-list-group>
          <v-list-group no-action>
            <template v-slot:activator>
              <v-list-item style="padding-left: 0;">
                <v-list-item-content>
                  <v-list-item-title>拉流请求最高画质</v-list-item-title>
                  <v-list-item-subtitle>{{Config.bitrate_Client}} KB/s @{{Config.framerate_Client}}fps</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
              <v-list-item>
                  <v-list-item-title>码率: {{Config.bitrate_Client}} KB/s<v-slider v-model="Config.bitrate_Client" min="2000" max="20000"></v-slider></v-list-item-title>
              </v-list-item>
              <v-list-item>
                  <v-list-item-title>帧数: {{Config.framerate_Client}} fps<v-slider v-model="Config.framerate_Client" min="10" max="144"></v-slider></v-list-item-title>
              </v-list-item>
          </v-list-group>
          <v-subheader>输入、输出设备</v-subheader>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                音频输入设备
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
                <v-select @change="getVol" :items="inputDevice" v-model="Config.inputDeviceID" item-text="label" item-value="deviceId"></v-select>
                <v-progress-linear :value="input_Volume"></v-progress-linear>
            </v-list-item-action>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                音频输出设备
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
                <v-select :items="outputDevice" v-model="Config.outputDeviceID" item-text="label" item-value="deviceId"></v-select>
            </v-list-item-action>
          </v-list-item>
          <v-subheader>弹幕设置</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch v-model="Config.danmukuDefault"></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>弹幕默认状态</v-list-item-title>
              <v-list-item-subtitle>每次进入直播间时是否开启弹幕</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch v-model="Config.danmukuRemember"></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>记忆弹幕状态</v-list-item-title>
              <v-list-item-subtitle>根据上次直播间内是否开启弹幕来决定下次进入直播间的弹幕状态，开启后将覆盖上面的选项</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>高级设置</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch v-model="Config.p2pAssist"></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>开启分流协助</v-list-item-title>
              <v-list-item-subtitle>开启后将会自动帮助主播端分流，可减轻主播端带宽压力，但是会使用本机上行带宽</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-group no-action>
            <template v-slot:activator>
              <v-list-item style="padding-left: 0;">
                <v-list-item-content>
                  <v-list-item-title>自定义中转服务器</v-list-item-title>
                  <v-list-item-subtitle>stun服务器以及turn服务器，自定义设置将覆盖原设置</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>stun服务器</v-list-item-title>
                  <v-list-item-subtitle>stun:stun.xxx.com</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-text-field v-model="Config.stunServer"></v-text-field>
                </v-list-item-action>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>turn服务器</v-list-item-title>
                  <v-list-item-subtitle>turn:turn.xxx.com[unm:pwd]</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-text-field v-model="Config.turnServer"></v-text-field>
                </v-list-item-action>
              </v-list-item>
          </v-list-group>
          <v-subheader>更新~</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>当前版本</v-list-item-title>
              <v-list-item-subtitle>{{currentVersion}}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
          </v-list-item>
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>检查更新</v-list-item-title>
              <v-list-item-subtitle>从服务器拉取更新</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
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
const { writeLocalConfig, loadLocalConfig } = require('../utils/tools')
export default {
  name: 'GlobalSetting',
  data () {
    return {
      Config: {
        themeColor: '#66CCFF',
        bitrate_Stream: 9000,
        framerate_Stream: 60,
        bitrate_Client: 9000,
        framerate_Client: 60,
        audio_Input: '',
        audio_Output: '',
        input: '',
        inputDeviceID: '',
        outputDeviceID: '',
        danmukuDefault: true,
        danmukuRemember: true,
        p2pAssist: true,
        stunServer: '',
        turnServer: ''
      },
      globalThis: global,
      colorPicker: false,
      color: '',
      input_Volume: 0,
      currentVersion: '1.0.0',
      input_Stream: null,
      inputDevice: [],
      outputDevice: []
    }
  },
  methods: {
    stopInput () {
      if (this.input_Stream) this.input_Stream.getTracks().forEach(x => x.stop())
    },
    clickHandle () {},
    getVol () {
      this.stopInput()
      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: this.Config.inputDeviceID }
      }).then(stream => {
        this.input_Stream = stream
        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(stream) // 引入音频流
        const analyser = audioCtx.createAnalyser() // 创建分析器
        source.connect(analyser) // 将stream连接到分析器上
        analyser.fftSize = 32 // 可以理解为设置频率的单位取样宽度

        const array = new Uint8Array(analyser.frequencyBinCount) // 保证长度满足
        analyser.getByteFrequencyData(array) // 将当前频域数据拷贝进数组
        const onePick = () => {
          var array = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(array) // 将当前的频率数据传入array
          this.input_Volume = (Math.max(...array) / 255) * 100 * 2
          requestAnimationFrame(onePick)
        } // 采样函数

        requestAnimationFrame(onePick)
      })
    },
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
  beforeDestroy () {
    this.stopInput()
  },
  mounted () {
    const config = loadLocalConfig('Config')
    if (config) this.Config = config
    // writeSessionStorage('Config', config)
    navigator.mediaDevices.enumerateDevices()
      .then(items => {
        items.filter(x => x.kind === 'audiooutput').forEach(x => {
          this.outputDevice.push(x)
        })
        if (!this.Config.outputDeviceID || !items.some(x => x.deviceId === this.Config.outputDeviceID)) {
          this.Config.outputDeviceID = this.outputDevice[0].deviceId
        }
        items.filter(x => x.kind === 'audioinput').forEach(x => {
          this.inputDevice.push(x)
        })
        if (!this.Config.inputDeviceID || !items.some(x => x.deviceId === this.Config.inputDeviceID)) {
          this.Config.inputDeviceID = this.inputDevice[0].deviceId
        }
        this.getVol()
      })
  }
}
</script>

<style>

</style>
