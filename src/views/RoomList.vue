<template>
  <div data-app="true">
    <v-list subheader two-line>
      <v-subheader inset>当前共有公开房间{{ roomList.length }}个</v-subheader>
      <v-list-item
        v-for="item in roomList"
        :key="item.creator"
        @dblclick="roomClick(item.id)"
        @click="signalClickHandle"
      >
        <v-list-item-avatar>
          <v-icon
            class="grey lighten-3"
            v-show="item.passwordNeeded"
          >
            mdi-lock
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title v-text="item.title"></v-list-item-title>
          <v-list-item-subtitle
            v-text="`${item.creator} - ${item.time}`"
          ></v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <span style="color: gray;">房间：{{item.personCount}}/{{item.max==-1?'∞':item.max}}</span>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-dialog max-width="500" persistent v-model="passwordDialog">
      <RoomPassword @onDialogClose="closePasswordDialog" v-if="passwordDialog"></RoomPassword>
    </v-dialog>
    <v-speed-dial
      v-model="fab"
      bottom
      right
      direction="left"
      open-on-hover
      transition="slide-x-reverse-transition"
    >
      <template v-slot:activator>
        <v-btn
          v-model="fab"
          color="primary"
          dark
          fab
        >
          <v-icon v-if="fab">
            mdi-close
          </v-icon>
          <v-icon v-else>
            mdi-plus
          </v-icon>
        </v-btn>
      </template>
      <v-tooltip top v-model="tipFilterShow" attach="#tipFilter">
        过滤
      </v-tooltip>
      <v-btn
        id="tipFilter"
        color="primary"
        fab
        dark
        small
        @mouseover="tipFilterShow = true"
        @mouseleave="tipFilterShow = false"
        @click="callFilter"
      >
        <v-icon>mdi-filter-variant</v-icon>
      </v-btn>
      <v-tooltip top v-model="tipNewShow" attach="#tipNew">
        新建
      </v-tooltip>
      <v-btn
        id="tipNew"
        color="green"
        fab
        dark
        small
        @mouseover="tipNewShow = true"
        @mouseleave="tipNewShow = false"
        @click="callNewRoom"
      >
        <v-icon>mdi-plus-box-outline</v-icon>
      </v-btn>
    </v-speed-dial>
    <v-dialog v-model="newRoomDialog">
      <NewRoom @onDialogClose="newRoomDialog=false" v-if="newRoomDialog"></NewRoom>
    </v-dialog>
    <v-dialog v-model="filterDialog">

    </v-dialog>
    <v-overlay :value="formSend">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <span style="margin-left: 1vw">向服务器请求房间数据...</span>
    </v-overlay>
  </div>
</template>

<script>
import NewRoom from '../components/NewRoom.vue'
import RoomPassword from '../components/RoomPassword.vue'
import { Info } from '../utils/dialog'
import { readSessionStorage } from '../utils/tools'
import { createChildWindow } from '../utils/windowsHelper'
export default {
  components: {
    NewRoom,
    RoomPassword
  },
  data () {
    return {
      fab: false,
      tipFilterShow: false,
      tipNewShow: false,
      filterDialog: false,
      newRoomDialog: false,
      passwordDialog: false,
      selectRoomID: 0,
      selectRoomPassword: '',
      formSend: false,
      server: Window.$WebSocket,
      roomList: [
        {
          id: 1,
          creator: '666',
          title: 'testRoom',
          time: '2021-11-18 13:46:02',
          passwordNeeded: false,
          personCount: 10,
          max: 30
        },
        {
          id: 2,
          creator: '666777',
          title: 'testRoom-2',
          time: '2021-11-18 10:46:02',
          passwordNeeded: true,
          personCount: 114514,
          max: -1
        }
      ]
    }
  },
  methods: {
    roomClick (id) {
      this.selectRoomID = -1
      this.selectRoomPassword = ''
      const room = this.roomList.find(x => x.id === id)
      if (room) {
        if (room.passwordNeeded) {
          this.selectRoomID = id
          this.passwordDialog = true
          return
        }
        if (room.max !== 51 && room.personCount >= room.max) {
          this.snackbar.Error('房间已满')
          return
        }
        this.enterRoom(id)
      } else {
        this.snackbar.Error('房间不存在')
      }
    },
    enterRoom (id) {
      this.formSend = true
      this.server.On('EnterRoom', (data) => {
        this.formSend = false
        if (data.code === 200) {
          createChildWindow('streamer/client/')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('EnterRoom', { id: this.selectRoomID, password: this.selectRoomPassword })
      this.formSend = false
      // this.$router.push('streamer/client')
      createChildWindow('streamer/client/')
    },
    callNewRoom () {
      this.newRoomDialog = true
    },
    callFilter () {
      this.filterDialog = true
    },
    closePasswordDialog (data) {
      this.passwordDialog = false
      if (data && this.selectRoomID) {
        this.selectRoomPassword = data
        this.enterRoom(this.selectRoomID)
      }
    },
    signalClickHandle () {}
  },
  mounted () {
    this.user = readSessionStorage('user')
    if (!this.user || !readSessionStorage('LoginFlag')) {
      Info('登录失效，点击重新登录').then(() => { window.location.href = './' })
    }
    console.log(this.user)
  }
}
</script>

<style scoped>
.v-speed-dial {
  position: absolute;
}
</style>
<style>
.v-dialog {
  background: white;
}
</style>
