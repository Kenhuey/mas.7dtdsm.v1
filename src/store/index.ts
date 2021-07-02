import { createStore } from "vuex";

export default createStore({
  state: {
    routeList: [
      {
        path: "/",
        iconClass: "el-icon-pie-chart",
      },
      {
        path: "/server-config",
        iconClass: "el-icon-files",
      },
      // {
      //   path: "/frp-config",
      //   iconClass: "el-icon-s-promotion",
      // },
    ],
    steamCmcPath: "",
  },
  mutations: {},
  actions: {},
  modules: {},
});
