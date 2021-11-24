<template>
  <v-card>
    <v-card-title>
      修改邮箱
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-fade-transition leave-absolute>
        <v-container transition="fade-transition" v-if="verifyOldEmailFlag">
        <v-row>
          <v-text-field label="旧邮箱*" v-model="user.Email" disabled></v-text-field>
        </v-row>
        <v-row style="align-items: center;">
          <v-text-field label="邮箱验证码*" v-model="oldCaptcha" :rules="rules.captcha" :disabled="formSend" @keydown="checkEnter"></v-text-field>
          <v-btn color="primary" style="margin-left: 10px;" @click="generateCaptcha" :loading="formSend">{{captchaText}}</v-btn>
        </v-row>
      </v-container>
      <v-container transition="fade-transition" v-if="!verifyOldEmailFlag">
        <v-row>
          <v-text-field label="新邮箱*" v-model="newEmail" :rules="rules.email" :disabled="formSend"></v-text-field>
        </v-row>
        <v-row style="align-items: center;">
          <v-text-field label="邮箱验证码*" v-model="newCaptcha" :rules="rules.captcha" :loading="formSend" :disabled="formSend" @keydown="checkEnter"></v-text-field>
          <v-btn color="primary" style="margin-left: 10px;" @click="generateCaptcha" :loading="formSend">{{captchaText}}</v-btn>
        </v-row>
      </v-container>
      </v-fade-transition>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="closeDialog">关闭</v-btn>
      <v-btn text color="primary" :loading="formSend" @click="verifyCaptcha">提交</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { readSessionStorage, rulesVerify } from '../utils/tools'
export default {
  name: 'ChangeEmail',
  data () {
    return {
      user: {},
      formPass: [false, false],
      rules: {
        email: [val => {
          let r = (val || '').length > 0 || '请填写邮箱'
          if (r !== '请填写邮箱') {
            if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(val)) { r = '无效的邮箱' }
          }
          this.formPass[0] = rulesVerify(r)
          return r
        }],
        captcha: [val => {
          const r = (val || '').length === 6 || '验证码格式有误'
          this.formPass[1] = rulesVerify(r)
          return r
        }]
      },
      oldCaptcha: '',
      captchaCD: 60,
      captchaText: '获取验证码',
      captchaTimer: null,
      formSend: false,
      newCaptcha: '',
      newEmail: '',
      verifyOldEmailFlag: true,
      server: Window.$WebSocket
    }
  },
  methods: {
    closeDialog () {
      this.$emit('onDialogClose', true)
    },
    generateCaptcha () {
      if ((this.verifyOldEmailFlag || this.formPass[0]) && this.captchaText === '获取验证码') {
        this.server.On('GetEmailCaptcha', data => {
          this.formSend = false
          if (data.code === 200) {
            this.snackbar.Success('验证码获取成功')
            this.captchaTimer = setInterval(() => {
              if (this.captchaCD === 0) {
                this.captchaCD = 60
                clearInterval(this.captchaTimer)
                this.captchaText = '获取验证码'
                return
              }
              this.captchaText = this.captchaCD.toString()
              this.captchaCD--
            }, 1000)
          } else {
            this.snackbar.Error(data.msg)
          }
        })
        this.server.Emit('GetEmailCaptcha', { id: this.user.Id, email: this.verifyOldEmailFlag ? this.user.Email : this.newEmail })
        this.formSend = true
      }
    },
    verifyCaptcha () {
      if (this.formPass[1]) {
        this.server.On('VerifyEmailCaptcha', data => {
          this.formSend = false
          if (data.code === 200) {
            if (this.verifyOldEmailFlag) {
              this.snackbar.Success('验证成功')
              clearInterval(this.captchaTimer)
              this.captchaText = '获取验证码'
              this.captchaCD = 60
              this.verifyOldEmailFlag = false
            } else {
              this.formSend = true
              this.server.Emit('ChangeEmail', { newEmail: this.newEmail })
            }
          } else {
            this.snackbar.Error(data.msg)
          }
        })
        this.server.On('ChangeEmail', data => {
          this.formSend = false
          if (data.code === 200) {
            this.snackbar.Success('修改成功')
            window.location.reload()
          } else {
            this.snackbar.Error(data.msg)
          }
        })
        if (this.verifyOldEmailFlag) {
          this.server.Emit('VerifyEmailCaptcha', { email: this.user.Email, captcha: this.oldCaptcha })
        } else {
          this.server.Emit('VerifyEmailCaptcha', { email: this.newEmail, captcha: this.newCaptcha })
        }
        this.formSend = true
      } else {
        this.snackbar.Error('请填写验证码')
      }
    },
    checkEnter (e) {
      if (e.key && e.key === 'Enter') {
        this.verifyCaptcha()
      }
    }
  },
  mounted () {
    this.verifyOldEmailFlag = true
    this.user = readSessionStorage('user')
  }
}
</script>

<style>

</style>
