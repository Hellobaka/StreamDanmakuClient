<template>
  <v-card>
    <v-card-title>
      用户中心
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-container class="slimScrollbar" style="max-height: 500px; overflow-y: scroll; overflow-x: hidden;">
        <v-row style="align-items: center"> </v-row>
        <v-list subheader style="margin: 20px 0">
          <v-subheader>头像及昵称</v-subheader>
          <v-list-item>
            <v-list-item-icon>
              <v-avatar color="primary" class="clickable" @click="clickHandle">
                <v-icon dark> mdi-account-circle </v-icon>
              </v-avatar>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>昵称</v-list-item-title>
              <v-list-item-subtitle v-if="!nickEditFlag">
                  {{ user.NickName }}
                <v-btn icon @click="showNickNameChange"><v-icon>mdi-pencil</v-icon></v-btn>
              </v-list-item-subtitle>
              <v-list-item-subtitle v-if="nickEditFlag">
                  <v-text-field v-model="editNickName" @keyup.stop="onNickNameChange" hint="按Esc退出或按Enter确认"></v-text-field>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>个人详情</v-subheader>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>ID</v-list-item-title>
              <v-list-item-subtitle>{{ user.Id }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="changeEmail=true">
            <v-list-item-content>
              <v-list-item-title>Email</v-list-item-title>
              <v-list-item-subtitle>{{ user.Email }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
            <v-dialog v-model="changeEmail" max-width="400" persistent>
              <ChangeEmail @onDialogClose="changeEmail=false" v-if="changeEmail"></ChangeEmail>
            </v-dialog>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>注册时间</v-list-item-title>
              <v-list-item-subtitle>{{ user.CreateTime }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>操作</v-subheader>
          <v-list-item @click="manageMuteList">
            <v-list-item-content>
              <v-list-item-title>禁言管理</v-list-item-title>
              <v-list-item-subtitle>管理个人房间的禁言用户列表</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
            <v-dialog v-model="muteList" max-width="750">
              <MuteList @onDialogClose="muteList=false" v-if="muteList"></MuteList>
            </v-dialog>
          </v-list-item>
          <v-list-item @click="changePassword = true">
            <v-list-item-content>
              <v-list-item-title>修改密码</v-list-item-title>
              <v-list-item-subtitle
                >修改密码将导致个人离线</v-list-item-subtitle
              >
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
            <v-dialog v-model="changePassword" max-width="400">
              <ChangePassword @onDialogClose="changePassword=false" v-if="changePassword"></ChangePassword>
            </v-dialog>
          </v-list-item>
          <v-list-item @click="callLogout">
            <v-list-item-content>
              <v-list-item-title>登出</v-list-item-title>
              <v-list-item-subtitle>将账号登出</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
          </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="closeDialog" text color="primary">关闭</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import ChangeEmail from './ChangeEmail'
import MuteList from './MuteList'
import ChangePassword from './ChangePassword.vue'
import { readSessionStorage, writeSessionStorage, logout } from '../utils/tools'
const { Confirm } = require('../utils/dialog')

export default {
  name: 'UserCenter',
  components: {
    ChangeEmail,
    ChangePassword,
    MuteList
  },
  data () {
    return {
      user: {},
      editNickName: '',
      server: Window.$WebSocket,
      nickEditFlag: false,
      changeEmail: false,
      changePassword: false,
      muteList: false
    }
  },
  methods: {
    async callLogout () {
      const res = await Confirm('确认要注销吗？', '注销提醒')
      if (res) {
        this.closeDialog()
        logout(this.$router)
      }
    },
    manageMuteList () {
      this.muteList = true
    },
    clickHandle () {},
    onNickNameChange (e) {
      this.server.On('ChangeNickName', async data => {
        if (data.code === 200) {
          this.snackbar.Success('修改成功')
          this.user.NickName = this.editNickName
          writeSessionStorage('user', this.user)
          this.nickEditFlag = false
        } else {
          this.snackbar.Error(data.msg)
          this.nickEditFlag = false
        }
      })
      if (e.key === 'Enter') {
        if (this.editNickName.trim() === this.user.NickName) {
          this.nickEditFlag = false
        } else {
          this.server.Emit('ChangeNickName', { nickName: this.editNickName })
        }
      } else if (e.key === 'Escape') {
        this.nickEditFlag = false
        e.stopPropagation()// ???为什么和.stop一样没用
      }
    },
    showNickNameChange () {
      this.editNickName = this.user.NickName
      this.nickEditFlag = true
    },
    closeDialog () {
      this.$emit('onDialogClose', true)
    }
  },
  async mounted () {
    this.user = readSessionStorage('user')
  }
}
</script>
<style scoped>
.hidden{
  display: none;
}
</style>
