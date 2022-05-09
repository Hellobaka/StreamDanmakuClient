<template>
  <v-container transition="fade-transition">
    <v-text-field label="账号" @keydown.enter="handleAccountEnter" v-model="loginConfig.account" :disabled="formSend" :rules="rules.account"></v-text-field>
    <v-text-field
      v-model="loginConfig.password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.password"
      label="密码"
      hint="至少8个字符"
      ref="password"
      @click:append="showPassword = !showPassword"
      :disabled="formSend"
      @keyup="checkEnterKey($event)"
    ></v-text-field>
    <div style="display: flex; align-items:center;">
      <v-switch v-model="loginConfig.rememberPassword" label="记住密码" style="margin-right: 2vw;" @change="loginConfigChange('RememberPassword')"></v-switch>
      <v-switch v-model="loginConfig.autoLogin" label="自动登录" @change="loginConfigChange('AutoLogin')"></v-switch>
      <v-btn :loading="formSend" @click="$router.push('forgetpwd')" style="margin-left: 10px;">找回密码</v-btn>
    </div>

    <v-container style="display: flex;justify-content: space-around">
      <v-btn color="primary" :loading="formSend" @click="login" width="200px">登录</v-btn>
      <v-btn color="plain" :loading="formSend" @click="$router.push('./register')" width="200px">注册</v-btn>
    </v-container>
  </v-container>
</template>

<script>
import { emit, loadLocalConfig, writeLocalConfig, writeSessionStorage } from '../utils/tools'
export default {
  name: 'Login',
  data () {
    return {
      showPassword: false,
      loginConfig: {
        rememberPassword: false,
        autoLogin: false,
        account: '',
        password: ''
      },
      formSend: false,
      formPass: [false, false],
      rules: {
        account: [val => {
          if ((val || '').length >= 3) {
            this.formPass[0] = true
            return true
          }
          this.formPass[0] = false
          return '至少3个字符'
        }],
        password: [val => {
          if ((val || '').length >= 8) {
            this.formPass[1] = true
            return true
          }
          this.formPass[1] = false
          return '至少8个字符'
        }]
      },
      server: Window.$WebSocket
    }
  },
  methods: {
    login () {
      if (!this.formPass.every(x => x) && !(this.loginConfig.account.length > 3 && this.loginConfig.password.length >= 8)) {
        this.snackbar.Error('请先完成表单')
        return
      }
      const form = { account: this.loginConfig.account, password: this.loginConfig.password }
      this.formSend = true
      writeLocalConfig('LoginConfig', 'account', this.loginConfig.account, true)
      this.server.On('Login', (data) => {
        if (data.code === 200) {
          writeSessionStorage('JWT', data.data)
          this.server.Emit('GetInfo', { type: 'client', jwt: data.data })
        } else {
          this.snackbar.Error(data.msg)
          this.formSend = false
        }
      })
      this.server.TempGetInfoCallback = (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.snackbar.Success('登录成功')
          this.server.On('GetFriendRequestCount', data => {
            if (data.code === 200) {
              emit('notification-count', data.data)
            } else {
              this.snackbar.Error(data.msg)
            }
          })
          this.server.Emit('GetFriendRequestCount')
          if (this.loginConfig.rememberPassword) {
            writeLocalConfig('LoginConfig', 'password', this.loginConfig.password, true)
          }
          this.$router.replace({ path: './roomList' })
        } else {
          this.snackbar.Error(data.msg)
        }
      }
      if (!this.server.Emit('Login', form)) {
        this.formSend = false
      }
    },
    loginConfigChange (config) {
      switch (config) {
        case 'RememberPassword':
          writeLocalConfig('LoginConfig', 'rememberPassword', this.loginConfig.rememberPassword, true)
          break
        case 'AutoLogin':
          if (this.loginConfig.autoLogin) {
            this.loginConfig.rememberPassword = true
            writeLocalConfig('LoginConfig', 'rememberPassword', this.loginConfig.rememberPassword, true)
          }
          writeLocalConfig('LoginConfig', 'autoLogin', this.loginConfig.autoLogin, true)
          break
      }
    },
    checkEnterKey (e) {
      if (e.key === 'Enter') {
        this.login()
      }
    },
    handleAccountEnter () {
      if (!this.loginConfig.password) {
        this.$refs.password.focus()
      } else {
        this.login()
      }
    }
  },
  mounted () {
    this.loginConfig = loadLocalConfig('LoginConfig', true)
    if (this.loginConfig.autoLogin) {
      this.login()
    }
  }
}
</script>
