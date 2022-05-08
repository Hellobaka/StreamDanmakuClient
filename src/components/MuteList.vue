<template>
  <v-card>
    <v-card-title>
      管理禁言列表
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        item-key="Id"
        loading-text="加载中"
        no-data-text="没有数据"
        no-results-text="没有符合结果"
        :footer-props="{
          'items-per-page-text': '每页显示条数',
          'items-per-page-all-text': '显示所有',
        }"
      >
        <template v-slot:top>
          <div style="display: flex; align-items: center; padding: 0 10px">
            <v-btn icon @click="fetchLists"><v-icon>mdi-refresh</v-icon></v-btn>
            <v-text-field
              v-model="search"
              label="搜索任何内容"
              class="mx-4"
            ></v-text-field>
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn text color="primary" @click="removeMute(item)">解除禁言</v-btn>
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="removeMute()">全部移除</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" text @click="closeDialog">关闭</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'MuteList',
  mounted () {
    this.fetchLists()
  },
  data () {
    return {
      users: [],
      headers: [
        {
          text: '用户ID',
          value: 'Id'
        },
        {
          text: '昵称',
          value: 'NickName'
        },
        {
          text: '操作',
          align: 'center',
          value: 'actions',
          sortable: false
        }
      ],
      search: '',
      server: Window.$WebSocket
    }
  },
  methods: {
    closeDialog () {
      this.$emit('onDialogClose', true)
    },
    removeMute (item) {
      this.server.On('MuteUser', (data) => {
        if (data.code === 200) {
          this.snackbar.Success('操作成功')
          this.fetchLists(false)
        } else {
          this.snackbar.Error(data.msg)
        }
      })

      if (item) {
        this.server.Emit('MuteUser', { id: [item.Id], action: false })
      } else {
        this.server.Emit('MuteUser', {
          id: this.users
            .filter(
              (x) =>
                x.Id.toString().indexOf(this.search) !== -1 ||
                x.NickName.indexOf(this.search) !== -1
            ).map((item) => item.Id),
          action: false
        })
      }
    },
    fetchLists (flag = true) {
      this.server.On('GetMuteList', (data) => {
        if (data.code === 200) {
          this.users = data.data
          if (flag) this.snackbar.Success('拉取成功')
        } else {
          this.snackbar.Error(data.msg)
        }
      })
      this.server.Emit('GetMuteList')
    }
  }
}
</script>

<style></style>
