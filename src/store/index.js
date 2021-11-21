import Vue from 'vue'
import Vuex from 'vuex'
const { writeLocalConfig } = require('../utils/tools')
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    LoginConfig: {
      account: '',
      password: '',
      rememberPassword: false,
      autoLogin: false
    },
    User: {
      id: 0,
      nickName: '',
      createTime: ''
    }
  },
  mutations: {
    loadConfig (state, config) {
      state[config.section] = config.payload
    },
    setAccount (state, account) {
      state.LoginConfig.account = account
      writeLocalConfig('LoginConfig', 'account', account)
    },
    setPassword (state, password) {
      state.LoginConfig.password = password
      writeLocalConfig('LoginConfig', 'password', password)
    },
    setRememberPwd (state, flag) {
      state.LoginConfig.rememberPassword = flag
      writeLocalConfig('LoginConfig', 'rememberPassword', flag)
    },
    setAutoLogin (state, flag) {
      state.LoginConfig.autoLogin = flag
      writeLocalConfig('LoginConfig', 'autoLogin', flag)
    },
    setUser (state, user) {
      state.User.id = user.id
      state.User.nickName = user.nickName
      state.User.createTime = user.createTime
    }
  },
  actions: {
  },
  modules: {
  }
})
