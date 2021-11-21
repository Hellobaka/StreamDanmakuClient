<template>
  <v-container transition="fade-transition">
    <v-text-field label="Account" v-model="account" :disabled="formSend" :rules="rules.account"></v-text-field>
    <v-text-field
      v-model="password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.password"
      label="Password"
      hint="At least 8 characters"
      @click:append="showPassword = !showPassword"
      :disabled="formSend"
      @keyup="checkEnterKey($event)"
    ></v-text-field>
    <div style="display: flex;">
      <v-switch v-model="rememberPassword" label="RememberPassword" style="margin-right: 2vw;" @change="loginConfigChange('RememberPassword')"></v-switch>
      <v-switch v-model="autoLogin" label="AutoLogin" @change="loginConfigChange('AutoLogin')"></v-switch>
    </div>
    <v-container style="display: flex;justify-content: space-around">
      <v-btn color="primary" :loading="formSend" @click="login">Login</v-btn>
      <v-btn color="plain" :loading="formSend" @click="$router.push('./register')">Register</v-btn>
    </v-container>
  </v-container>
</template>

<script>
const { loadLocalConfig } = require('../utils/tools')
export default {
  name: 'Login',
  data () {
    return {
      showPassword: false,
      rememberPassword: false,
      autoLogin: false,
      account: '',
      password: '',
      formSend: false,
      formPass: [false, false],
      rules: {
        account: [val => {
          if ((val || '').length > 3) {
            this.formPass[0] = true
            return true
          }
          this.formPass[0] = false
          return 'At least 3 characters'
        }],
        password: [val => {
          if ((val || '').length >= 8) {
            this.formPass[1] = true
            return true
          }
          this.formPass[1] = false
          return 'At least 8 characters'
        }]
      },
      server: Window.$WebSocket
    }
  },
  methods: {
    login () {
      if (!this.formPass.every(x => x) && !(this.account.length > 3 && this.password.length >= 8)) {
        this.snackbar.Error('Complete the form first')
        return
      }
      const form = { account: this.account, password: this.password }
      this.formSend = true
      this.$store.commit('setAccount', this.account)
      this.server.On('Login', (data) => {
        this.formSend = false
        console.log(data)
        if (data.code === 200) {
          this.snackbar.Success(data.msg)
          if (this.rememberPassword) {
            this.$store.commit('setPassword', this.password)
          }
          window.sessionStorage.setItem('user', JSON.stringify(data.data))
          this.$router.replace({ path: './roomList' })
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Login', form)
    },
    loginConfigChange (config) {
      switch (config) {
        case 'RememberPassword':
          this.$store.commit('setRememberPwd', this.rememberPassword)
          break
        case 'AutoLogin':
          if (this.autoLogin) {
            this.rememberPassword = true
            this.$store.commit('setRememberPwd', this.rememberPassword)
          }
          this.$store.commit('setAutoLogin', this.autoLogin)
          break
      }
    },
    checkEnterKey (e) {
      if (e.key === 'Enter') {
        this.login()
      }
    }
  },
  mounted () {
    loadLocalConfig()
    this.account = this.$store.state.LoginConfig.account
    this.password = this.$store.state.LoginConfig.password
    this.rememberPassword = this.$store.state.LoginConfig.rememberPassword
    this.autoLogin = this.$store.state.LoginConfig.autoLogin
    if (this.autoLogin) {
      this.login()
    }
  }
}
</script>
