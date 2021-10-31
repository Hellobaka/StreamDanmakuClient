<template>
  <v-container transition="fade-transition">
    <v-text-field label="Account" v-model="account" :disabled="formSend" :rules="rules.required"></v-text-field>
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
    ></v-text-field>
    <v-container style="display: flex;justify-content: space-around">
      <v-btn color="primary" :loading="formSend" @click="login">Login</v-btn>
      <v-btn color="plain" :loading="formSend" @click="$router.push('./register')">Register</v-btn>
    </v-container>
  </v-container>
</template>

<script>
export default {
  name: 'Login',
  data () {
    return {
      showPassword: false,
      account: '',
      password: '',
      formSend: false,
      rules: {
        required: [val => (val || '').length > 0 || 'This field is required'],
        password: [val => (val || '').length >= 8 || 'At least 8 characters']
      }
    }
  },
  methods: {
    login () {
      const form = { account: this.account, password: this.password }
      this.formSend = true
      this.server.On('Login', (data) => {
        this.formSend = false
        console.log(data)
        if (data.code === 200) {
          this.snackbar.Success(data.msg)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('Login', form)
    }
  }
}
</script>
