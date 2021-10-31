<template>
  <v-container>
    <v-text-field label="Account" v-model="form.account" :disabled="formSend" :rules="rules.required"></v-text-field>
    <v-text-field
      v-model="form.password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.password"
      label="Password"
      hint="At least 8 characters"
      @click:append="showPassword = !showPassword"
      :disabled="formSend"
    ></v-text-field>
    <v-text-field
      v-model="confirmPassword"
      :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showConfirmPassword ? 'text' : 'password'"
      name="input-10-1"
      :rules="rules.confirmPwd"
      label="ConfirmPassword"
      hint="At least 8 characters"
      @click:append="showConfirmPassword = !showConfirmPassword"
      :disabled="formSend"
    ></v-text-field>

  </v-container>
</template>

<script>
export default {
  data () {
    return {
      form: {
        account: '',
        password: ''
      },
      confirmPassword: '',
      formSend: false,
      showPassword: false,
      showConfirmPassword: false,
      rules: {
        required: val => [val => (val || '').length > 0 || 'This field is required'],
        password: [val => (val || '').length >= 8 || 'At least 8 characters'],
        confirmPwd: val => {
          if (val !== this.form.password) return 'Password is not equal'
          return true
        }
      }
    }
  }
}
</script>
