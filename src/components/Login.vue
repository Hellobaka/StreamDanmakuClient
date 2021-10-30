<template>
  <v-container>
    <v-text-field label="Account" v-model="account" :disabled="formSend"></v-text-field>
    <v-text-field
      v-model="password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      label="Password"
      hint="At least 8 characters"
      @click:append="showPassword = !showPassword"
      :disabled="formSend"
    ></v-text-field>
    <v-container style="display: flex;justify-content: space-around">
      <v-btn color="primary" :loading="formSend" @click="login">Login</v-btn>
      <v-btn color="plain" :loading="formSend">Register</v-btn>
    </v-container>
    <v-overlay :value="!ServerConnected">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <span style="margin-left: 1vw">Connecting to Server...</span>
    </v-overlay>
  </v-container>
</template>

<script>
export default {
  name: 'Login',
  data () {
    return {
      account: '',
      password: '',
      formSend: false,
      showPassword: false,
      ServerConnected: false,
      server: Window.$WebSocket
    }
  },
  methods: {
    init () {
      // cnm
      setInterval(() => {
        this.ServerConnected = this.server.connection.readyState === 1
      }, 500)
    },
    login () {
      const form = { account: this.account, password: this.password }
      this.formSend = true
      this.server.Emit('Login', form)
      this.server.On('Login', (data) => {
        this.formSend = false
        if (data.code === 200) {
          alert('ok')
        } else {
          alert(data.msg)
        }
      })
    }
  },
  mounted () {
    this.init()
  }
}
</script>
