<template>
  <v-card>
    <v-card-title>全局设置</v-card-title>
    <v-card-text>
      <v-container></v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('onDialogClose', true)" text>关闭</v-btn>
      <v-btn text color="primary">保存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'GlobalSetting'
}
</script>

<style>

</style>
