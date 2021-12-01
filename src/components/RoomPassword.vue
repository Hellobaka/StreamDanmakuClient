<template>
  <v-card>
    <v-card-title>
      进入此房间需要密码
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-text-field
        label="密码*"
        v-model="password"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="showPassword = !showPassword"
        @keydown.enter="closeDialog(password)"
        :loading="formSend"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="closeDialog()">关闭</v-btn>
      <v-btn text color="primary" @click="verifyPassword" :loading="formSend">提交</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'RoomPassword',
  data () {
    return {
      password: '',
      showPassword: '',
      formSend: false,
      server: Window.$WebSocket
    }
  },
  props: {
    RoomID: Number
  },
  methods: {
    verifyPassword () {
      this.formSend = true
      this.server.On('VerifyRoomPassword', data => {
        this.formSend = false
        if (data.code === 200) this.closeDialog(this.password)
        else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('VerifyRoomPassword', { id: this.RoomID, password: this.password })
    },
    closeDialog (password) {
      this.$emit('onDialogClose', password)
    }
  }
}
</script>

<style>

</style>
