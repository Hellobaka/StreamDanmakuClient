import Vue from 'vue'
import VueRouter from 'vue-router'
// import { readSessionStorage } from '../utils/tools'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: '首页',
    redirect: '/login',
    component: () => import('../views/ToolBar.vue'),
    children: [
      {
        path: 'login',
        name: '登录',
        component: () => import('../views/Login.vue')
      },
      {
        path: 'roomList',
        name: '房间列表',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/RoomList.vue')
      },
      {
        path: 'register',
        name: '账号注册',
        component: () => import('../views/Register.vue')
      }
    ]
  },
  {
    path: '/streamer',
    name: 'Streamer',
    component: () => import('../views/Streamer/Layout.vue'),
    children: [
      {
        path: 'client',
        name: '客户端',
        component: () => import('../views/Streamer/Client.vue')
      },
      {
        path: 'server',
        name: '推流端',
        component: () => import('../views/Streamer/Server.vue')
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.name} - webrtc-client`
  next()
  // if (to.name !== '登录' && !readSessionStorage('LoginFlag')) next({ name: '登录' })
  // else next()
})

export default router
