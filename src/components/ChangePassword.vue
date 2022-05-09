<template>
  <v-card>
    <v-card-title>
      修改密码
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-text-field
        label="旧密码*"
        v-model="form.oldPassword"
        :rules="rules.oldPassword"
        :disabled="formSend"
        :append-icon="showOldPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showOldPassword ? 'text' : 'password'"
        @click:append="showOldPassword = !showOldPassword"
      ></v-text-field>
      <v-text-field
        label="新密码*"
        v-model="form.newPassword"
        :rules="rules.newPassword"
        :disabled="formSend"
        :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showNewPassword ? 'text' : 'password'"
        @click:append="showNewPassword = !showNewPassword"
      ></v-text-field>
      <v-text-field
        label="确认密码*"
        v-model="form.confirmPassword"
        :rules="rules.confirmPassword"
        :disabled="formSend"
        :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showConfirmPassword ? 'text' : 'password'"
        @click:append="showConfirmPassword = !showConfirmPassword"
        @keydown.enter="changePassword"
      ></v-text-field>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="closeDialog">关闭</v-btn>
      <v-btn text color="primary" :loading="formSend" @click="changePassword"
        >提交</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
const { rulesVerify, writeSessionStorage, md5Encrypt, logout } = require('../utils/tools')
const { Info } = require('../utils/dialog')
export default {
  name: 'ChangePassword',
  data () {
    return {
      user: {},
      rules: {
        oldPassword: [
          (val) => {
            const r = (val || '').length >= 8 || '至少8个字符'
            this.formPass[0] = rulesVerify(r)
            return r
          }
        ],
        newPassword: [
          (val) => {
            const r = (val || '').length >= 8 || '至少8个字符'
            this.formPass[1] = rulesVerify(r)
            return r
          }
        ],
        confirmPassword: [
          (val) => {
            const r =
              ((val || '') === this.form.newPassword && !!this.form.newPassword) ||
              '新旧密码不一致'
            this.formPass[2] = rulesVerify(r)
            return r
          }
        ]
      },
      server: Window.$WebSocket,
      formPass: [false, false, false],
      confirmPassword: '',
      form: {
        oldPassword: '',
        newPassword: ''
      },
      formSend: false,
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    }
  },
  methods: {
    closeDialog () {
      this.$emit('onDialogClose', true)
    },
    changePassword () {
      if (this.formPass.some((x) => x === false)) {
        this.snackbar.Error('请先完成表单')
      } else {
        this.server.On('ChangePasswordOnline', (data) => {
          this.formSend = false
          if (data.code === 200) {
            Info('修改成功，点击确定重新登录。', '密码修改')
              .then(async () => {
                writeSessionStorage('user', null)
                writeSessionStorage('JWT', null)
              })
              .finally(() => {
                logout(this.$router)
              })
          } else {
            this.snackbar.Error(data.msg)
          }
        })
        const encryptForm = {
          oldPassword: md5Encrypt(this.form.oldPassword),
          newPassword: md5Encrypt(this.form.newPassword)
        }
        this.server.Emit('ChangePasswordOnline', encryptForm)
        this.formSend = true
      }
    }
  }
}
</script>

<style>
</style>
