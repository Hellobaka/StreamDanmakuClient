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
    }
  },
  mutations: {
    loadConfig (state, config) {
      state[config.section] = config.payload
    },
    setAccount (state, account) {
      state.LoginConfig.account = account
      writeLocalConfig(state.LoginConfig, 'LoginConfig')
    },
    setPassword (state, password) {
      state.LoginConfig.password = password
      writeLocalConfig(state.LoginConfig, 'LoginConfig')
    },
    setRememberPwd (state, flag) {
      state.LoginConfig.rememberPassword = flag
      writeLocalConfig(state.LoginConfig, 'LoginConfig')
    },
    setAutoLogin (state, flag) {
      state.LoginConfig.autoLogin = flag
      writeLocalConfig(state.LoginConfig, 'LoginConfig')
    }
  },
  actions: {
  },
  modules: {
  }
})
