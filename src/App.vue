<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-icon
          slot="icon"
          size="36"
          @click="$router.go(-1)"
        >
          mdi-arrow-left
        </v-icon>
      </div>
      <h3>{{$route.name}}</h3>
      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
        text
      >
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
     <v-overlay :value="!ServerConnected">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <span style="margin-left: 1vw">Connecting to Server...</span>
    </v-overlay>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    ServerConnected: false,
    server: Window.$WebSocket
  }),
  methods: {
    init () {
      // cnm
      setInterval(() => {
        this.ServerConnected = this.server.connection.readyState === 1
      }, 500)
    }
  },
  mounted () {
    this.init()
  }
}
</script>
