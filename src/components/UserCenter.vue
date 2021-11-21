<template>
  <v-card>
    <v-card-title>用户中心</v-card-title>
    <v-card-text>
      <v-container fluid>
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
              <v-list-item-subtitle>
                  {{ user.NickName }}
                <v-btn icon><v-icon>mdi-pencil</v-icon></v-btn>
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
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>Email</v-list-item-title>
              <v-list-item-subtitle>{{ user.Email }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>注册时间</v-list-item-title>
              <v-list-item-subtitle>{{ user.CreateTime }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-subheader>操作</v-subheader>
          <v-list-item @click="clickHandle">
            <v-list-item-content>
              <v-list-item-title>修改密码</v-list-item-title>
              <v-list-item-subtitle
                >修改密码将导致个人离线</v-list-item-subtitle
              >
            </v-list-item-content>
            <v-list-item-action><v-icon>mdi-menu-right</v-icon></v-list-item-action>
          </v-list-item>
          <v-list-item @click="clickHandle">
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
      <v-btn @click="$emit('onDialogClose', true)" text>关闭</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'UserCenter',
  data () {
    return {
      user: {},
      server: Window.$WebSocket
    }
  },
  methods: {
    logout () {
      this.$store.commit('setAutoLogin', false)
      window.location.href = './'
    },
    clickHandle () {}
  },
  mounted () {
    this.user = this.server.user
    if (!this.user.Id) {
      const sessionUser = window.sessionStorage.getItem('user')
      if (!sessionUser) {
        window.location.href = './'
      }
      this.user = JSON.parse(sessionUser)
    }
    console.log(this.user)
  }
}
</script>
