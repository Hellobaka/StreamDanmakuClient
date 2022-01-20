<template>
  <div data-app="true">
    <v-list subheader two-line style="position: relative;">
      <v-subheader inset>
        当前共有公开房间{{ roomList.length }}个 在线人数{{ onlineUserCount }}
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-on="on" v-bind="attrs" icon @click="getRoomList"><v-icon>mdi-refresh</v-icon></v-btn>
        </template>
        <span>刷新列表</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-on="on" v-bind="attrs" icon @click="joinRoomDialog=true"><v-icon>mdi-plus</v-icon></v-btn>
          <v-dialog max-width="500" persistent v-model="joinRoomDialog">
            <JoinRoom @onDialogClose="closeJoinRoom" v-if="joinRoomDialog"></JoinRoom>
          </v-dialog>
        </template>
        <span>加入房间</span>
      </v-tooltip>
      </v-subheader>
      <v-list-item>
        <v-text-field v-model="filter.keyword" label="搜索" solo prepend-inner-icon="mdi-magnify" hide-details clearable @click:clear="filter.keyword=''"></v-text-field>
      </v-list-item>
      <v-list-item class="text-center">
        <v-chip class="ma-1" :color="filter.withoutPassword?'primary':'default'" @click="filterChange('withoutPassword')">无密码</v-chip>
        <v-chip class="ma-1" :color="filter.withPassword?'primary':'default'" @click="filterChange('withPassword')">有密码</v-chip>
        <v-chip class="ma-1" :color="filter.onTime?'primary':'default'" @click="filterChange('onTime')">按创建时间{{filter.onTimeDesc?'晚':'早'}}</v-chip>
        <v-chip class="ma-1" :color="filter.onID?'primary':'default'" @click="filterChange('onID')">按房间号{{filter.onIDDesc?'大':'小'}}</v-chip>
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
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
      <v-btn
        id="tipNew"
        color="green"
        fab
        dark
        v-on="on"
        v-bind="attrs"
        @mouseover="tipNewShow = true"
        @mouseleave="tipNewShow = false"
        @click="callNewRoom"
        style="position:absolute;right:20px;bottom:20px;"
      >
        <v-icon>mdi-plus-box-outline</v-icon>
      </v-btn>
      </template>
      <span>新建房间</span>
    </v-tooltip>
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
import JoinRoom from '../components/JoinRoom.vue'
// eslint-disable-next-line no-unused-vars
import { Info } from '../utils/dialog'
// eslint-disable-next-line no-unused-vars
import { loadLocalConfig, readSessionStorage, routerJump } from '../utils/tools'
import { createChildWindow } from '../utils/windowsHelper'
export default {
  components: {
    NewRoom,
    RoomPassword,
    JoinRoom
  },
  data () {
    return {
      fab: false,
      tipFilterShow: false,
      tipNewShow: false,
      filterDialog: false,
      newRoomDialog: false,
      passwordDialog: false,
      joinRoomDialog: false,
      selectRoomID: 0,
      selectRoomPassword: '',
      formSend: true,
      server: Window.$WebSocket,
      roomList: [],
      onlineUserCount: 0,
      filter: {
        keyword: '',
        onTime: false,
        onTimeDesc: false,
        onID: false,
        onIDDesc: false,
        withoutPassword: false,
        withPassword: false
      }
    }
  },
  computed: {
    filterList: function () {
      const key = this.filter.keyword
      let filterArray = this.roomList
      if (key !== null) {
        filterArray = filterArray.filter(x => x.Title.contain(key) || x.RoomID.toString().contain(key) || x.CreatorName.contain(key))
      }
      if (this.filter.withPassword) {
        filterArray = filterArray.filter(x => x.PasswordNeeded === true)
      } else if (this.filter.withoutPassword) {
        filterArray = filterArray.filter(x => x.PasswordNeeded === false)
      }
      if (this.filter.onTime) {
        if (this.filter.onTimeDesc) {
          filterArray.sort((a, b) => a.time < b.time ? 1 : -1)
        } else {
          filterArray.sort((a, b) => a.time > b.time ? 1 : -1)
        }
      } else if (this.filter.onID) {
        if (this.filter.onIDDesc) {
          filterArray.sort((a, b) => a.RoomID < b.RoomID ? 1 : -1)
        } else {
          filterArray.sort((a, b) => a.RoomID > b.RoomID ? 1 : -1)
        }
      }
      return filterArray
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
      switch (label) {
        case 'withPassword':
          this.filter.withPassword = !this.filter.withPassword
          if (this.filter.withPassword) this.filter.withoutPassword = false
          break
        case 'withoutPassword':
          this.filter.withoutPassword = !this.filter.withoutPassword
          if (this.filter.withoutPassword) this.filter.withPassword = false
          break
        case 'onTime':
          if (this.filter.onTime) {
            if (this.filter.onTimeDesc) {
              this.filter.onTimeDesc = false
              this.filter.onTime = false
            } else {
              this.filter.onTimeDesc = true
            }
          } else {
            this.filter.onTime = true
          }
          break
        case 'onID':
          if (this.filter.onID) {
            if (this.filter.onIDDesc) {
              this.filter.onIDDesc = false
              this.filter.onID = false
            } else {
              this.filter.onIDDesc = true
            }
          } else {
            this.filter.onID = true
          }
          break
        default:
          break
      }
    },
    closeJoinRoom (data) {
      console.log(data)
      this.joinRoomDialog = false
      if (data.result) {
        this.selectRoomPassword = data.password
        this.enterRoom(data.id)
      }
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
    this.server.On('OnlineUserCount', data => {
      this.onlineUserCount = data.count
    })
    this.server.On('OnlineUserChange', data => {
      this.onlineUserCount = data.count
    })
    this.server.On('RoomAdd', (data) => {
      const room = data
      room.time = moment(room.CreateTime).format('yyyy-MM-DD HH:mm:ss')
      this.roomList.push(room)
    })
    this.server.On('RoomRemove', (data) => {
      const room = data.roomID
      console.log(this.roomList)
      for (const item of this.roomList) {
        if (item.RoomID === room) {
          this.roomList.splice(this.roomList.indexOf(item), 1)
          break
        }
      }
    })
    this.server.Emit('OnlineUserCount', '')
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
