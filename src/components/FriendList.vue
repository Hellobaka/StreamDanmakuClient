<template>
  <v-card width="350px" max-height="600px">
    <v-card-title>
      好友列表
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
    </v-card-title>
    <v-card-text>
      <div style="display: flex; align-items: center;">
        <v-btn icon @click="fetchFriendList"><v-icon>mdi-refresh</v-icon></v-btn>
        <v-text-field
          v-model="search"
          label="搜索任何内容"
          class="mx-4"
        ></v-text-field>
        <v-btn icon @click="fetchFriendList"><v-icon>mdi-account-plus</v-icon></v-btn>
      </div>
      <div style="padding: 20px;" class="text-center" v-if="friendList.length === 0">(・ω・) 暂时没有好友</div>
      <v-list v-else>
        <v-list-item v-for="item in friendList" :key="item.Id" @click="clickable">
          <v-list-item-avatar class="online" v-if="item.Streamer"><v-icon>mdi-broadcast</v-icon></v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-bind:class="{offline: !item.Online, online: item.Online}">{{item.NickName}} - {{item.Online? '在线' : '离线'}}</v-list-item-title>
            <v-list-item-subtitle>{{item.RoomText}}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'FriendList',
  mounted () {
    this.fetchFriendList()
  },
  data () {
    return {
      friendList: [],
      server: Window.$WebSocket,
      search: ''
    }
  },
  methods: {
    clickable () {},
    closeDialog () {
      this.$emit('onDialogClose', true)
    },
    fetchFriendList () {
      this.server.On('GetFriendList', (data) => {
        if (data.code === 200) {
          this.friendList = data.data
          this.friendList.forEach(x => {
            if (!x.CurrentRoom) x.RoomText = ''
            else {
              if (x.CurrentRoom.RoomID === x.Id) {
                x.RoomText = `正在直播 ${x.CurrentRoom.Title}`
                x.Streamer = true
              } else {
                x.RoomText = `正在观看直播 ${x.CurrentRoom.Title}`
              }
            }
          })
          console.log(this.friendList)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetFriendList')
    }
  }
}
</script>

<style scoped>
.offline {
  color: lightgray;
}
.online{
  color: #66ccff
}
</style>
