import Vue from 'vue'

export function Confirm (text, title) {
  return Vue.prototype.$dialog.confirm({
    text,
    title,
    actions: [
      { text: '否', color: 'black', key: false },
      { text: '是', color: 'blue', key: true }
    ]
  })
}

export function Info (text, title) {
  return Vue.prototype.$dialog.info({
    text,
    title
  })
}
