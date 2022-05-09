<template>
  <v-container transition="fade-transition">
    <v-text-field label="用户名" v-model="form.NickName" :disabled="formSend" :rules="rules.account" required></v-text-field>
    <v-text-field label="邮箱" hint="可用于找回密码" v-model="form.Email" :disabled="formSend" :rules="rules.email" type="email" required></v-text-field>
    <v-text-field
      v-model="form.Password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.password"
      label="密码"
      hint="密码至少8个字符"
      @click:append="showPassword = !showPassword"
      :disabled="formSend"
      required
    ></v-text-field>
    <v-text-field
      v-model="confirmPassword"
      :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showConfirmPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.confirmPwd"
      label="确认密码"
      hint="请重复上面的密码"
      @click:append="showConfirmPassword = !showConfirmPassword"
      :disabled="formSend"
      @keydown.enter="reg"
      required
    ></v-text-field>
    <div style="display: flex; align-items: center;">
      <v-text-field v-model="captcha" label="邮箱验证码" :rules="rules.captcha"></v-text-field>
      <v-btn :disabled="getCaptchaIntervalCD!==0" color="primary" width="200px" style="margin-left: 10px;" @click="getCaptcha">{{getCaptchaText}}</v-btn>
    </div>
    <v-btn color="primary" @click="reg" :loading="formSend" width="200px">注册</v-btn>
  </v-container>
</template>

<script>
import { logout, md5Encrypt } from '../utils/tools'
// const { md5Encrypt } = require('../utils/tools')
export default {
  data () {
    return {
      server: Window.$WebSocket,
      form: {
        NickName: '',
        Password: '',
        Email: ''
      },
      captcha: '',
      formPass: [false, false, false, false, false],
      confirmPassword: '',
      formSend: false,
      showPassword: false,
      showConfirmPassword: false,
      getCaptchaText: '获取验证码',
      getCaptchaIntervalHandle: 0,
      getCaptchaIntervalCD: 0,
      rules: {
        account: [val => {
          let r = (val || '').length > 0 || '用户名不得为空'
          if (val.length < 3) r = '用户名不得少于3个字符'
          this.formPass[0] = this.rulesQuery(r)
          return r
        }],
        email: [val => {
          let r = (val || '').length > 0 || '邮箱不得为空'
          if (r !== '邮箱不得为空') {
            if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(val)) { r = '邮箱格式错误' }
          }
          this.formPass[1] = this.rulesQuery(r)
          return r
        }],
        password: [val => {
          const r = (val || '').length >= 8 || '密码至少8个字符'
          this.formPass[2] = this.rulesQuery(r)
          return r
        }],
        confirmPwd: [val => {
          const r = ((val || '') === this.form.Password && !!this.form.Password) || '两次密码不一致'
          this.formPass[3] = this.rulesQuery(r)
          return r
        }],
        captcha: [val => {
          this.formPass[4] = false
          if ((val || '').length >= 4) {
            if (isNaN(val)) {
              return '验证码只能为数字'
            }
            this.formPass[4] = true
            return true
          } else {
            return '验证码不得小于4位'
          }
        }]
      }
    }
  },
  methods: {
    reg () {
      if (!this.formPass.every(x => x === true)) {
        this.snackbar.Error('请先完成表单')
        return
      }
      // this.form.Password = md5Encrypt(this.form.Password)
      // this.confirmPassword = md5Encrypt(this.confirmPassword)
      this.formSend = true
      this.server.On('VerifyEmailCaptcha', (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.form.Password = md5Encrypt(this.form.Password)
          this.server.Emit('Register', this.form)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.On('Register', (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.snackbar.Success('注册成功')
          logout(this.$router)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('VerifyEmailCaptcha', { email: this.form.Email, captcha: this.captcha })
    },
    rulesQuery (result) {
      if (typeof result === 'string') return false
      return result
    },
    getCaptcha () {
      if (!this.formPass[1]) {
        this.snackbar.Error('请先填写邮箱')
        return
      }
      this.server.On('GetEmailCaptcha', (data) => {
        if (data.code === 200) {
          this.getCaptchaIntervalCD = 60
          this.snackbar.Success(data.msg)
          clearInterval(this.getCaptchaIntervalHandle)
          this.getCaptchaIntervalHandle = setInterval(() => {
            if (this.getCaptchaIntervalCD === 0) {
              this.getCaptchaText = '获取验证码'
            } else {
              this.getCaptchaIntervalCD--
              this.getCaptchaText = `${this.getCaptchaIntervalCD} 秒后重新获取`
            }
          }, 1000)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetEmailCaptcha', { email: this.form.Email })
    }
  }
}
</script>
