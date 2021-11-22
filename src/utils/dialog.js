import Vue from 'vue'

export function Confirm (text, title) {
  return Vue.prototype.$dialog.confirm({
    text,
    title
  })
}

export function Info (text, title) {
  return Vue.prototype.$dialog.info({
    text,
    title
  })
}
