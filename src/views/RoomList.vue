<template>
  <div data-app="true">
    <v-list subheader two-line>
      <v-subheader inset>
        当前共有公开房间{{ roomList.length }}个
        <v-btn icon @click="getRoomList"><v-icon>mdi-refresh</v-icon></v-btn>
        <v-btn icon @click="createServerWin"><v-icon>mdi-plus</v-icon></v-btn>
      </v-subheader>
      <v-list-item>
        <v-text-field v-model="filter.keyword" label="搜索" solo prepend-inner-icon="mdi-magnify" hide-details clearable></v-text-field>
      </v-list-item>
      <v-list-item class="text-center">
        <v-chip class="ma-1" :color="filter.isPublic?'primary':'default'" @click="filterChange('isPublic')">公开</v-chip>
        <v-chip class="ma-1" :color="filter.passwordNeeded?'primary':'default'" @click="filterChange('passwordNeeded')">无密码</v-chip>
        <v-chip class="ma-1" :color="filter.passwordNeeded?'default':'primary'" @click="filterChange('passwordNeeded')">有密码</v-chip>
      </v-list-item>
      <v-list-item
        v-for="item in filterList"
        :key="item.CreatorName"
        @dblclick="roomClick(item.RoomID)"
        @click="signalClickHandle"
      >
        <v-list-item-avatar>
          <v-icon
            class="grey lighten-3"
            v-show="item.PasswordNeeded"
          >
            mdi-lock
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title v-text="item.Title"></v-list-item-title>
          <v-list-item-subtitle
            v-text="`${item.CreatorName} - ${item.time}`"
          ></v-list-item-subtitle>
          <v-dialog max-width="500" persistent v-model="passwordDialog">
            <RoomPassword @onDialogClose="closePasswordDialog" v-if="passwordDialog" :RoomID="item.RoomID"></RoomPassword>
          </v-dialog>
        </v-list-item-content>
        <v-list-item-action>
          <span style="color: gray;">房间: {{item.ClientCount}}/{{item.Max==-1?'∞':item.Max}}</span>
        </v-list-item-action>
      </v-list-item>
    </v-list>
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
import moment from 'moment'
import NewRoom from '../components/NewRoom.vue'
import RoomPassword from '../components/RoomPassword.vue'
// eslint-disable-next-line no-unused-vars
import { Info } from '../utils/dialog'
// eslint-disable-next-line no-unused-vars
import { loadLocalConfig, readSessionStorage, routerJump } from '../utils/tools'
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
      formSend: true,
      server: Window.$WebSocket,
      roomList: [],
      filter: {
        keyword: '',
        isPublic: true,
        passwordNeeded: false
      }
    }
  },
  computed: {
    filterList: function () {
      const key = this.filter.keyword
      return this.roomList.filter(x => x.Title.contain(key) || x.RoomID.toString().contain(key) || x.CreatorName.contain(key)).filter(x => x.IsPublic === this.filter.isPublic && x.PasswordNeeded === this.filter.passwordNeeded)
    }
  },
  methods: {
    roomClick (id) {
      this.selectRoomID = -1
      this.selectRoomPassword = ''
      const room = this.roomList.find(x => x.RoomID === id)
      if (room) {
        if (room.PasswordNeeded) {
          this.selectRoomID = id
          this.passwordDialog = true
          return
        }
        if (room.Max !== 51 && room.ClientCount >= room.Max) {
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
          createChildWindow(`streamer/client?id=${id}`, true)
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('EnterRoom', { id, password: this.selectRoomPassword })
      // this.formSend = false
      // this.$router.push('streamer/client')
      // createChildWindow(`streamer/client?id=${id}`, true)
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
    signalClickHandle () {},
    getRoomList () {
      this.server.On('RoomList', data => {
        this.formSend = false
        console.log(data)
        if (data.code === 200) {
          this.roomList = data.data || []
          this.roomList.forEach(x => {
            x.time = moment(x.CreateTime).format('yyyy-MM-DD HH:mm:ss')
          })
          this.snackbar.Success('获取房间列表成功')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.formSend = true
      this.server.Emit('RoomList', {})
    },
    createServerWin () {
      createChildWindow('streamer/server', false)
    },
    filterChange (label) {
      this.filter[label] = !this.filter[label]
      this.updateResult()
    },
    updateResult () {

    }
  },
  mounted () {
    // eslint-disable-next-line no-extend-native
    String.prototype.contain = function (pattern) {
      return this.indexOf(pattern) !== -1
    }
    this.config = loadLocalConfig('Config')
    if (this.config && this.config.themeColor) {
      this.$vuetify.theme.themes.light.primary = this.config.themeColor
    }
    console.log('Load Local Config Success.')
    this.getRoomList()
    this.server.On('RoomAdd', (data) => {
      const room = data
      room.time = moment(room.CreateTime).format('yyyy-MM-DD HH:mm:ss')
      this.roomList.push(room)
    })
    this.server.On('RoomRemove', (data) => {
      const room = data.roomID
      for (const item in this.roomList) {
        if (item.RoomID === room) {
          console.log(item)
          this.roomList.splice(this.roomList.indexOf(item), 1)
          break
        }
      }
    })
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
