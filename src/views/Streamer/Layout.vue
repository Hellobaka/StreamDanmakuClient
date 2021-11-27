<template>
  <router-view />
</template>

<script>
import { loadLocalConfig } from '../../utils/tools'
const { app } = require('@electron/remote')

export default {
  mounted () {
    app.global.Application.Config = loadLocalConfig('Config')
  }
}
</script>
<style >
  html {
    overflow: hidden;
  }
</style>
