<template>
  <v-card>
    <v-card-title>用户中心</v-card-title>
    <v-card-text>
      <v-container>
        <v-btn @click="logout">注销</v-btn>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="$emit('onDialogClose', true)" text>关闭</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'UserCenter',
  data () {
    return {

    }
  },
  methods: {
    logout () {
      this.$store.commit('setAutoLogin', false)
      window.location.href = './'
    }
  },
  mounted () {

  }
}
</script>
