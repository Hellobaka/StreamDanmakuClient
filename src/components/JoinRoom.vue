<template>
  <v-card>
    <v-card-title>加入房间</v-card-title>
    <v-card-text>
      <v-container>
        <v-text-field
          label="邀请码/房间ID"
          v-model="query"
          :disabled="formSend"
          @keydown.enter="joinRoom"
        ></v-text-field>
        <v-dialog max-width="500" persistent v-model="passwordDialog">
          <RoomPassword @onDialogClose="closePasswordDialog" v-if="passwordDialog" :RoomID="roomID"></RoomPassword>
        </v-dialog>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('onDialogClose', { result: false })" text>关闭</v-btn>
      <v-btn color="primary" text @click="joinRoom" :loading="formSend"
        >确认</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import RoomPassword from '../components/RoomPassword.vue'

export default {
  components: {
    RoomPassword
  },
  name: 'JoinRoom',
  data () {
    return {
      query: '',
      formSend: false,
      passwordDialog: false,
      server: Window.$WebSocket,
      selectRoomPassword: '',
      roomID: 0
    }
  },
  methods: {
    joinRoom () {
      if (!this.query) {
        this.snackbar.Error('请填写房间邀请码或ID')
        return
      }
      this.formSend = true
      this.server.On('JoinRoom', (data) => {
        this.formSend = false
        if (data.code === 200) {
          this.roomID = data.data.id
          if (data.data.passwordNeeded) {
            this.passwordDialog = true
          } else {
            this.snackbar.Success('房间加入成功')
            this.$emit('onDialogClose', { result: true, id: this.roomID })
          }
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('JoinRoom', { query: this.query })
    },
    closePasswordDialog (data) {
      this.passwordDialog = false
      if (data && this.roomID) {
        this.selectRoomPassword = data
        this.$emit('onDialogClose', { result: true, id: this.roomID, password: this.selectRoomPassword })
      }
    }
  }
}
</script>

<style scoped>
</style>
