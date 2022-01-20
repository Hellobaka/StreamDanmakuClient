<template>
  <v-card>
    <v-card-title>创建房间</v-card-title>
    <v-card-text>
      <v-container>
        <v-text-field
          label="房间标题*"
          v-model="title"
          :disabled="formSend"
          :rules="rules.required"
          @keydown.enter="createRoom"
        ></v-text-field>
        <v-switch v-model="isPublic" label="房间是否公开"></v-switch>
        <v-text-field
          label="房间密码"
          v-model="password"
          :disabled="formSend"
          @keydown.enter="createRoom"
        ></v-text-field>
        <v-subheader class="pl-0">
          房间人数上限: {{ max == 51 ? '∞' : max }}
        </v-subheader>
        <v-slider
          v-model="max"
          min="2"
          max="51"
          thumb-label
          :disabled="formSend"
        ></v-slider>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('onDialogClose', true)" text>关闭</v-btn>
      <v-btn color="primary" text @click="createRoom" :loading="formSend"
        >提交</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { createChildWindow } from '../utils/windowsHelper'
export default {
  name: 'NewRoom',
  data () {
    return {
      title: '',
      isPublic: true,
      password: '',
      formSend: false,
      formPass: false,
      server: Window.$WebSocket,
      max: 10,
      rules: {
        required: [
          (val) => {
            if (val.length > 0) {
              this.formPass = true
              return true
            }
            this.formPass = false
            return '请填写标题'
          }
        ]
      }
    }
  },
  methods: {
    createRoom () {
      if (!this.formPass) {
        this.snackbar.Error('请先完成表单')
        return
      }
      this.formSend = true
      this.server.On('CreateRoom', (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.snackbar.Success('房间创建成功，进入推流界面……')
          this.createServerWin()
          this.$emit('onDialogClose', true)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('CreateRoom', { title: this.title, isPublic: this.isPublic, password: this.password, max: this.max })
    },
    createServerWin () {
      createChildWindow('streamer/server', false)
    }

  }
}
</script>

<style scoped>
</style>
