<template>
  <v-card>
    <v-card-title>全局设置</v-card-title>
    <v-card-text>
      <v-container>
        <v-list subheader>
          <v-subheader>画质设置</v-subheader>
          <v-list-group no-action>
            <template v-slot:activator>
              <v-list-item style="padding-left: 0;">
                <v-list-item-content>
                  <v-list-item-title>直播允许最高画质</v-list-item-title>
                  <v-list-item-subtitle>{{bitrate}} KB/s @{{framerate}}fps</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
              <v-list-item>
                  <v-list-item-title>码率: {{bitrate}} KB/s<v-slider v-model="bitrate" min="2000" max="20000"></v-slider></v-list-item-title>
              </v-list-item>
              <v-list-item>
                  <v-list-item-title>帧数: {{framerate}} fps<v-slider v-model="framerate" min="10" max="144"></v-slider></v-list-item-title>
              </v-list-item>
          </v-list-group>
          <v-list-group no-action>
            <template v-slot:activator>
              <v-list-item style="padding-left: 0;">
                <v-list-item-content>
                  <v-list-item-title>拉流请求最高画质</v-list-item-title>
                  <v-list-item-subtitle>{{bitrate}} KB/s @{{framerate}}fps</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
              <v-list-item>
                  <v-list-item-title>码率: {{bitrate}} KB/s<v-slider v-model="bitrate" min="2000" max="20000"></v-slider></v-list-item-title>
              </v-list-item>
              <v-list-item>
                  <v-list-item-title>帧数: {{framerate}} fps<v-slider v-model="framerate" min="10" max="144"></v-slider></v-list-item-title>
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
                <v-select :items="['OBS Virtual Audio1','OBS Virtual Audio2','OBS Virtual Audio3']"></v-select>
                <v-progress-linear value="15"></v-progress-linear>
            </v-list-item-action>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                音频输出设备
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
                <v-select :items="['OBS Virtual Audio1','OBS Virtual Audio2','OBS Virtual Audio3']"></v-select>
                <v-progress-linear value="25"></v-progress-linear>
            </v-list-item-action>
          </v-list-item>
          <v-subheader>弹幕设置</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>弹幕默认状态</v-list-item-title>
              <v-list-item-subtitle>每次进入直播间时是否开启弹幕</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch></v-switch>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>记忆弹幕状态</v-list-item-title>
              <v-list-item-subtitle>根据上次直播间内是否开启弹幕来决定下次进入直播间的弹幕状态，开启后将覆盖上面的选项</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>高级设置</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-action>
              <v-switch></v-switch>
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
                  <v-text-field></v-text-field>
                </v-list-item-action>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>turn服务器</v-list-item-title>
                  <v-list-item-subtitle>turn:turn.xxx.com[unm:pwd]</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-text-field></v-text-field>
                </v-list-item-action>
              </v-list-item>
          </v-list-group>
          <v-subheader>更新~</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>当前版本</v-list-item-title>
              <v-list-item-subtitle>1.0.8</v-list-item-subtitle>
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
      <v-btn @click="$emit('onDialogClose', true)" text>关闭</v-btn>
      <v-btn text color="primary">保存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'GlobalSetting',
  data () {
    return {
      bitrate: 9000,
      framerate: 60
    }
  },
  methods: {
    clickHandle () {}
  }
}
</script>

<style>

</style>
