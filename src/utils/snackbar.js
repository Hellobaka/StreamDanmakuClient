import Vue from 'vue'

function Success (msg, timeout = 1500) {
  Vue.prototype.$dialog.notify.success(msg, {
    timeout: timeout,
    queueable: true
  })
}
function Info (msg, timeout = 1500) {
  Vue.prototype.$dialog.notify.info(msg, {
    timeout: timeout,
    queueable: true
  })
}
function Warning (msg, timeout = 2500) {
  Vue.prototype.$dialog.notify.warning(msg, {
    timeout: timeout,
    queueable: true
  })
}
function Error (msg, timeout = 2500) {
  Vue.prototype.$dialog.notify.error(msg, {
    timeout: timeout,
    queueable: true
  })
}
export default {
  Success,
  Info,
  Warning,
  Error
}
