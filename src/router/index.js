import Vue from 'vue'
import VueRouter from 'vue-router'
import { readSessionStorage } from '../utils/tools'
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
  },
  {
    path: '/txcloud-live-streamer',
    name: 'txcloud-live-Streamer',
    component: () => import('../views/Streamer/Layout.vue'),
    children: [
      {
        path: 'client',
        name: '客户端',
        component: () => import('../views/Streamer/txcloud-live/Client.vue')
      },
      {
        path: 'server',
        name: '推流端',
        component: () => import('../views/Streamer/txcloud-live/Server.vue')
      }
    ]
  },
  {
    path: '/TRTC-streamer',
    name: 'TRTC-Streamer',
    component: () => import('../views/Streamer/Layout.vue'),
    children: [
      // {
      //   path: 'client',
      //   name: 'TRTC客户端',
      //   component: () => import('../views/Streamer/TRTC/Client.vue')
      // },
      // {
      //   path: 'server',
      //   name: 'TRTC推流端',
      //   component: () => import('../views/Streamer/TRTC/Server.vue')
      // }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },
  { path: '*', redirect: '/404', hidden: true }
]

const router = new VueRouter({
  routes
})
const whiteList = ['/login', '/register']
router.beforeEach(async (to, from, next) => {
  document.title = `${to.name} - webrtc-client`
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  const hasUser = await readSessionStorage('user')
  if (!hasUser) {
    const server = Window.$WebSocket
    server.TempGetInfoCallback = () => {
      next()
    }
  } else {
    next()
  }
})

export default router
