import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "DashBoard",
    component: () => import("../views/DashBoard.vue"),
  },
  {
    path: "/server-config",
    name: "ServerConfig",
    component: () => import("../views/ServerConfig.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
