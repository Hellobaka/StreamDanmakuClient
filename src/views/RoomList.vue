<template>
  <div>
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
        Filter
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
        New Room
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
      <NewRoom @onDialogClose="newRoomDialog=false"></NewRoom>
    </v-dialog>
    <v-dialog v-model="filterDialog">

    </v-dialog>
  </div>
</template>

<script>
import NewRoom from '../components/NewRoom.vue'
import { Info } from '../utils/dialog'
import { readSessionStorage } from '../utils/tools'
export default {
  components: {
    NewRoom
  },
  data () {
    return {
      fab: false,
      tipFilterShow: false,
      tipNewShow: false,
      filterDialog: false,
      newRoomDialog: false,
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
      console.log('enter room ', id)
    },
    callNewRoom () {
      this.newRoomDialog = true
    },
    callFilter () {
      this.filterDialog = true
    },
    signalClickHandle () {}
  },
  mounted () {
    this.user = readSessionStorage('user')
    if (!this.user) {
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
