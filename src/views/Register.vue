<template>
  <v-container transition="fade-transition">
    <v-text-field label="Account*" v-model="form.NickName" :disabled="formSend" :rules="rules.account" required></v-text-field>
    <v-text-field label="Email*" v-model="form.Email" :disabled="formSend" :rules="rules.email" type="email" required></v-text-field>
    <v-text-field
      v-model="form.Password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.password"
      label="Password*"
      hint="At least 8 characters"
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
      label="ConfirmPassword*"
      hint="At least 8 characters"
      @click:append="showConfirmPassword = !showConfirmPassword"
      :disabled="formSend"
      required
    ></v-text-field>
    <v-btn color="primary" @click="reg" :loading="formSend">Register</v-btn>
  </v-container>
</template>

<script>
const { md5Encrypt } = require('../utils/tools')
export default {
  data () {
    return {
      server: Window.$WebSocket,
      form: {
        NickName: '',
        Password: '',
        Email: ''
      },
      formPass: [false, false, false, false],
      confirmPassword: '',
      formSend: false,
      showPassword: false,
      showConfirmPassword: false,
      rules: {
        account: [val => {
          const r = (val || '').length > 0 || 'Account is required'
          this.formPass[0] = this.rulesQuery(r)
          return r
        }],
        email: [val => {
          let r = (val || '').length > 0 || 'Email is required'
          if (r !== 'Email is required') {
            if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(val)) { r = 'Invalid Email' }
          }
          this.formPass[1] = this.rulesQuery(r)
          return r
        }],
        password: [val => {
          const r = (val || '').length >= 8 || 'At least 8 characters'
          this.formPass[2] = this.rulesQuery(r)
          return r
        }],
        confirmPwd: [val => {
          const r = ((val || '') === this.form.Password && !!this.form.Password) || 'Password is not equal'
          this.formPass[3] = this.rulesQuery(r)
          return r
        }]
      }
    }
  },
  methods: {
    reg () {
      if (!this.formPass.every(x => x === true)) this.snackbar.Error('请先完成表单')
      this.form.Password = md5Encrypt(this.form.Password)
      this.confirmPassword = md5Encrypt(this.confirmPassword)
      this.formSend = true
      this.server.On('Register', (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.snackbar.Success(data.msg)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Register', this.form)
    },
    rulesQuery (result) {
      if (typeof result === 'string') return false
      return result
    }
  }
}
</script>
