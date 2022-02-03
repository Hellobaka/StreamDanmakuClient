import Vue from 'vue'

export function Confirm (text, title) {
  return Vue.prototype.$dialog.confirm({
    text,
    title,
    actions: {
      false: {
        text: '否',
        color: 'black'
      },
      true: {
        text: '是',
        color: 'primary'
      }
    }
  })
}

export function Info (text, title) {
  return Vue.prototype.$dialog.info({
    text,
    title
  })
}
