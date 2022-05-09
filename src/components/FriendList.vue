<template>
  <v-card width="350px" max-height="600px">
    <v-card-title>
      好友列表
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
    </v-card-title>
    <v-card-text>
      <div style="padding: 20px;" class="text-center" v-if="!hasUser">登录以获取好友信息</div>
      <div style="display: flex; align-items: center;" v-else>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon @click="fetchFriendList" v-bind="attrs" v-on="on"><v-icon>mdi-refresh</v-icon></v-btn>
          </template>
          <span>刷新列表</span>
        </v-tooltip>
        <v-text-field
          v-model="search"
          label="搜索任何内容"
          class="mx-4"
          @keyup="searchFriend"
          clearable
        ></v-text-field>
        <v-menu offset-y offset-x :close-on-content-click="false">
          <template v-slot:activator="{ on: menu, attrs }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on: tooltip }">
              <v-btn icon @click="fetchFriendList" v-bind="attrs" v-on="{ ...tooltip, ...menu }">
                <v-badge
                  :content="notificationCount"
                  :value="notificationCount"
                  color="primary"
                  overlap
                >
                  <v-icon>mdi-account-check</v-icon>
                </v-badge>
              </v-btn>
              </template>
              <span>好友请求列表</span>
            </v-tooltip>
          </template>
          <v-list v-model="showRequest" subheader two-line>
            <v-subheader>好友申请</v-subheader>
            <div style="padding: 20px;" class="text-center" v-if="requestList.length === 0">(・ω・) 暂无数据</div>
            <v-list-item v-for="item in requestList" :key="item.Id" @click="clickable">
              <v-list-item-content>
                <v-list-item-title>{{item.NickName}}</v-list-item-title>
                <v-list-item-subtitle>{{item.timeText}}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-container>
                  <v-row>
                    <v-btn icon color="primary" @click="handleRequest(item, true)"><v-icon>mdi-check</v-icon></v-btn>
                    <v-btn icon color="error" @click="handleRequest(item, false)"><v-icon>mdi-close</v-icon></v-btn>
                  </v-row>
                </v-container>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>
      <div style="padding: 20px;" class="text-center" v-if="hasUser && friendList.length === 0 && searchFriendList.length === 0">(・ω・) 暂时没有好友</div>
      <div v-else>
        <v-list two-line>
          <v-list-item v-for="item in friendList" :key="item.Id" @click="clickable">
            <v-list-item-avatar class="online" v-if="item.Streamer"><v-icon>mdi-broadcast</v-icon></v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-bind:class="{offline: !item.Online, online: item.Online}">{{item.NickName}} - {{item.Online? '在线' : '离线'}}</v-list-item-title>
              <v-list-item-subtitle>{{item.RoomText}}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-container>
                <v-row>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn @click="jumpToRoom(item)" :disabled="!item.RoomText" icon color="primary" v-bind="attrs" v-on="on"><v-icon>mdi-export</v-icon></v-btn>
                    </template>
                    <span>前往用户所在房间</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn @click="deleteFriend(item)" icon color="error" v-bind="attrs" v-on="on"><v-icon>mdi-close</v-icon></v-btn>
                    </template>
                    <span>删除好友</span>
                  </v-tooltip>
                </v-row>
              </v-container>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <v-list v-if="searchFriendList.length > 0" subheader two-line>
          <v-subheader>搜索结果</v-subheader>
          <v-list-item v-for="item in searchFriendList" :key="item.Id" @click="clickable">
            <v-list-item-avatar class="online" v-if="item.Streamer"><v-icon>mdi-broadcast</v-icon></v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-bind:class="{offline: !item.Online, online: item.Online}">{{item.NickName}} - {{item.Online? '在线' : '离线'}}</v-list-item-title>
              <v-list-item-subtitle>{{item.RoomText}}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon @click="addFriend(item)">mdi-account-plus</v-icon>
                </v-btn>
              </template>
              <span>发出申请</span>
            </v-tooltip>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import moment from 'moment'
import { emit, readSessionStorage } from '../utils/tools'
import { Confirm } from '../utils/dialog'
export default {
  name: 'FriendList',
  mounted () {
    if (this.hasUser) {
      this.fetchFriendList()
      this.server.On('FindFriend', this.handleFindFriend)
    }
  },
  data () {
    return {
      friendList: [],
      searchFriendList: [],
      requestList: [],
      server: Window.$WebSocket,
      search: '',
      notificationCount: 0,
      hasUser: readSessionStorage('user') != null,
      showRequest: false
    }
  },
  computed: {
    filterFriendList: function () {
      return this.friendList.filter(item => item.Id.toString().includes(this.search) || item.NickName.includes(this.search) || item.RoomText.includes(this.search))
    }
  },
  methods: {
    jumpToRoom (item) {
      if (this.$route.name === 'live-客户端') {
        Confirm('需要先退出房间，是否继续', '提示').then(res => {
          if (res) {
            emit('player-exit', true)
          }
        })
      } else {
        Confirm('是否前往好友所在的房间', '提示').then(res => {
          if (res) {
            emit('join-room', item.CurrentRoom.RoomID)
          }
        })
      }
    },
    deleteFriend (item) {
      this.server.On('RemoveFriend', data => {
        if (data.code === 200) {
          this.fetchFriendList()
          this.snackbar.Success('删除好友成功')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      Confirm('确认删除好友吗', '删除好友').then((result) => {
        if (result) {
          this.server.Emit('RemoveFriend', { id: item.Id })
        }
      })
    },
    handleRequest (item, agree) {
      this.server.On('HandleFriendRequest', data => {
        if (data.code === 200) {
          this.snackbar.Success('操作成功')
          this.fetchFriendList()
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('HandleFriendRequest', {
        request_id: item.Id,
        agree: agree
      })
    },
    addFriend (item) {
      this.server.On('CreateFriendRequest', data => {
        if (data.code === 200) {
          this.snackbar.Success('申请已发送')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('CreateFriendRequest', { to: item.Id })
    },
    handleFindFriend (data) {
      if (data.code === 200) {
        this.searchFriendList = data.data
      }
    },
    searchFriend () {
      this.searchFriendList = []
      this.server.Emit('FindFriend', { query: this.search })
    },
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
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetFriendList')
      this.fetchRequestCount()
      this.fetchRequestList()
    },
    fetchRequestList () {
      this.server.On('GetFriendRequestList', (data) => {
        if (data.code === 200) {
          this.requestList = data.data
          this.requestList.forEach(x => {
            x.timeText = moment(x.CreateTime).format('YYYY-MM-DD HH:mm:ss')
          })
          if (this.requestList.length === 0) {
            this.showRequest = false
          }
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetFriendRequestList')
    },
    fetchRequestCount () {
      this.server.On('GetFriendRequestCount', data => {
        if (data.code === 200) {
          emit('notification-count', data.data)
          this.notificationCount = data.data
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetFriendRequestCount')
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
