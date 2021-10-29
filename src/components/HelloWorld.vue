<template>
  <v-container>
    <v-text-field label="Account" v-model="account"></v-text-field>
    <v-text-field
      v-model="password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      name="input-10-1"
      label="Password"
      hint="At least 8 characters"
      @click:append="showPassword = !showPassword"
    ></v-text-field>
  </v-container>
</template>

<script>
export default {
  name: 'HelloWorld',

  data: () => ({
    account: '',
    password: '',
    showPassword: false
  })
}
</script>
