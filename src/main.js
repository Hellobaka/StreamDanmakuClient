import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import './socketio/client'

import VuetifyDialog from 'vuetify-dialog'
import 'vuetify-dialog/dist/vuetify-dialog.css'
import snackbar from './utils/snackbar'

import zhHans from 'vuetify/es5/locale/zh-Hans'
import 'typeface-roboto/index.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.prototype.snackbar = snackbar

Vue.config.productionTip = false

Vue.use(VuetifyDialog, {
  context: {
    vuetify
  },
  lang: {
    locales: { zhHans },
    current: 'zhHans'
  },
  icons: {
    iconfont: 'mdi'
  }
})

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
