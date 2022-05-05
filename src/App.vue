<template>
  <router-view />
</template>

<script>
import { loadLocalConfig } from './utils/tools'
export default {
  name: 'App',
  data () {
    return {
      config: {}
    }
  },
  mounted () {
    document.querySelector('body').classList.add('slimScrollbar')
    this.config = loadLocalConfig('Config')
    if (this.config && this.config.themeColor) {
      this.$vuetify.theme.themes.light.primary = this.config.themeColor
    }
  }
}
</script>
<style>
html{
  height: 100%;
}
body{
  height: 100%;
  background: rgba(255, 255, 255, 0)
}
.undraggable {
  -webkit-app-region: no-drag;
}
.draggable {
  -webkit-app-region: drag;
}
.slimScrollbar::-webkit-scrollbar {
  width : 10px;
  height: 1px;
}
.slimScrollbar::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background   : #535353;
}
.slimScrollbar::-webkit-scrollbar-track {
  border-radius: 10px;
  background   : #ededed;
}
</style>
