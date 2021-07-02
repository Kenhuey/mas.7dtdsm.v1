<template>
  <div class="main-container">
    <div class="main">
      <title-bar :_close-call="closeWnd"></title-bar>
      <div class="content">
        <el-container class="container">
          <el-aside class="router-tab-container" width="60px">
            <div class="router-tabs">
              <router-tab
                v-for="tab in tabs"
                :key="tab.path"
                :path="tab.path"
                :iconClass="tab.iconClass"
              ></router-tab>
            </div>
            <div class="setting-button" @click="showSettingPanel">
              <div class="el-icon-s-tools"></div>
            </div>
          </el-aside>
          <el-main class="router-view-container">
            <el-scrollbar>
              <router-view v-slot="{ Component }">
                <transition name="router-fade" mode="out-in">
                  <keep-alive>
                    <component :is="Component" />
                  </keep-alive>
                </transition>
              </router-view>
            </el-scrollbar>
          </el-main>
        </el-container>
      </div>
    </div>
    <el-drawer
      title="Setting"
      v-model="showSetting"
      destroy-on-close
      direction="btt"
      size="301px"
      :with-header="false"
      :before-close="handleSettingClose"
    >
      <div
        class="setting-container"
        v-loading="pageLoading"
        element-loading-text="Please wait, it take some time :)"
      >
        <el-scrollbar>
          <div class="item-2">
            <div class="border-1" style="float:right;">
              <n-input-group>
                <n-input-group-label :style="{ color: '#1e1e1e' }">Language</n-input-group-label>
                <n-select
                  :value="selectedLanguage"
                  :options="['english']"
                  :style="{ width: '100%' }"
                />
              </n-input-group>
            </div>
            <div class="border-1" style="float:right;text-align: left;">
              <div style="float: left;">
                <n-switch v-model:value="cfgNoticeWWC" @update:value="cfgNoticeWWCChange" />
              </div>
              <div style="text-indent: 14px;float: left;">Notice when window closing</div>
            </div>
          </div>
          <div class="item-2">
            <n-input-group>
              <n-input-group-label :style="{ color: '#1e1e1e' }">Steam CMD Path</n-input-group-label>
              <n-input
                readonly="true"
                :style="{ width: '79%' }"
                v-model:value="steamCmdPath"
                placeholder="Seems you didn't set your SteamCMD path yet."
              />
              <n-button type="default" ghost class="el-icon-folder-opened" @click="selectCMDFolder"></n-button>
              <n-button type="default" ghost class="el-icon-download" @click="createSteamCmd"></n-button>
            </n-input-group>
          </div>
        </el-scrollbar>
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRaw, unref, onMounted } from "vue";
import { useRouter, Router } from "vue-router"
import TitleBar from "@/components/TitleBar.vue"
import RouterTab from "@/components/RouterTab.vue"
import { useStore } from "vuex";
const Store = window.require("electron-store");
import RendererIpcs from "@/ipcs/renderer"
import defaultSetting from "@/assets/setting";
import renderer from "@/ipcs/renderer"
const fs = window.require("fs");
import { ElMessageBox, ElMessage } from 'element-plus';
const child_process = window.require('child_process');

const isDevelopment = process.env.NODE_ENV !== "production";

export default defineComponent(
  {
    components: { TitleBar, RouterTab },
    setup() {
      const store = useStore();
      const tabs = ref(store.state.routeList);
      const showSetting = ref(false);

      const cfgNoticeWWC = ref(false);

      const selectedLanguage = ref("")

      const steamCmdPath = ref("")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cfgStore: { get: (_arg: string) => any, set: (_arg: string, _arg2: any) => void };

      function syncSetting(_call: () => void) {
        RendererIpcs.getServerConfigPath2((_event, path) => {
          configPath.value = path;
          if (cfgStore === undefined) {
            cfgStore = new Store({
              schema: defaultSetting,
              cwd: configPath.value,
            });
          }
          selectedLanguage.value = toRaw(cfgStore.get("language") as string);
          cfgNoticeWWC.value = toRaw(cfgStore.get("noticeCloseWindow") as boolean);
          steamCmdPath.value = toRaw(cfgStore.get("steamCmdPath") as string);
          _call();
        });
      }

      function showSettingPanel() {
        showSetting.value = true;
        syncSetting(() => { return; });
      }

      function cfgNoticeWWCChange(value: boolean) {
        cfgStore.set("noticeCloseWindow", value);
      }

      const configPath = ref("");

      function selectCMDFolder() {
        renderer.getFolderDialog((_event, arg) => {
          fs.access(arg + "\\steamcmd.exe", fs.constants.F_OK, (_err: string) => {
            if (_err) {
              console.trace(`SteamCMD not Exist.${_err}`);
              ElMessageBox.alert("steamcmd.exe not exist, be sure to choose a correct directory.");
            }
            else {
              steamCmdPath.value = unref(arg);
              cfgStore.set("steamCmdPath", steamCmdPath.value);
              showSetting.value = unref(true);
            }
          });
        });
      }

      const pageLoading = ref(false);

      function createSteamCmd() {
        renderer.getFolderDialog((_event, arg) => {
          fs.readdir(arg, (_err: string, files: Array<string>) => {
            if (_err) {
              console.trace(_err);
              ElMessageBox.alert("Choosing folder failed, something wrong.");
              return;
            }
            if (files.length !== 0) {
              ElMessageBox.alert("Folder not empty.");
              return;
            }
            RendererIpcs.getPath("process", (_event, path1) => {
              if (isDevelopment) {
                const tpath = path1 + "\\thirdparty"
                try {
                  fs.copyFileSync(tpath + "\\steamcmd.exe", arg + "\\steamcmd.exe");
                  const steamcmdProcess = child_process.spawn(arg + "\\steamcmd.exe", ["+quit"]);
                  pageLoading.value = unref(true);
                  steamcmdProcess.stdout.on('data', (data: string) => {
                    console.log(`[STEAMCMD]:\n ${data}`)
                  })
                  steamcmdProcess.on('close', (code: string) => {
                    console.log(`SteamCMD init done: ${code}`);
                    pageLoading.value = unref(false);
                    steamCmdPath.value = unref(arg);
                  })
                } catch (_err) {
                  console.trace(_err);
                  ElMessageBox.alert("Cannot copy steamcmd.exe, something wrong.");
                  pageLoading.value = unref(false);
                }
              }
              else {
                const tpath = path1 + "\\resources\\thirdparty"
                try {
                  fs.copyFileSync(tpath + "\\steamcmd.exe", arg + "\\steamcmd.exe");
                  const steamcmdProcess = child_process.spawn(arg + "\\steamcmd.exe", ["+quit"]);
                  pageLoading.value = unref(true);
                  steamcmdProcess.stdout.on('data', (data: string) => {
                    console.log(`[STEAMCMD]:\n ${data}`)
                  });
                  steamcmdProcess.on('close', (code: string) => {
                    console.log(`SteamCMD init done: ${code}`);
                    pageLoading.value = unref(false);
                    steamCmdPath.value = unref(arg);
                  });
                } catch (_err) {
                  console.trace(_err);
                  ElMessageBox.alert("Cannot copy steamcmd.exe, something wrong.");
                  pageLoading.value = unref(false);
                }
              }
            })
          })
        });
      }

      function handleSettingClose(done: () => void) {
        syncSetting(() => {
          if (!pageLoading.value) {
            done();
          }
          else {
            ElMessage('SteamCMD still init, it will be soon...')
          }
        });
      }

      const router: Router = useRouter();

      onMounted(() => {
        router.push("/");
      });

      function closeWnd(_call: () => void) {
        syncSetting(() => {
          if (cfgNoticeWWC.value) {
            ElMessageBox
              .confirm('The window will close but process still running, check it in Tary.(You can close this notice in setting.)')
              .then(() => {
                _call();
              })
              .catch(() => {
                return;
              });
          }
          else {
            _call();
          }
        });
      }

      return {
        tabs,
        showSetting,
        showSettingPanel,
        configPath,
        cfgNoticeWWC,
        cfgNoticeWWCChange,
        selectedLanguage,
        steamCmdPath,
        selectCMDFolder,
        createSteamCmd,
        pageLoading,
        handleSettingClose,
        closeWnd
      }
    }
  }
);

</script>

<style lang="scss">
@import "@/styles/elementui.scss";
</style>

<style lang="scss" scoped>
@import "@/styles/common.scss";

.main-container {
  width: calc(100% - #{$shadow-weight} * 2);
  height: calc(100% - #{$shadow-weight} * 2);
  padding: $shadow-weight;
  overflow: hidden;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  font-size: $common-font-size;
  line-height: $common-line-height;
}

.main {
  width: 100%;
  height: 100%;
  box-shadow: $window-shadow;
  background-color: $theme-bg-color-container;
  border-radius: $common-border-radius;
  overflow: hidden;
}

.content {
  width: 100%;
  height: calc(#{$window-height} - #{$shadow-weight} * 2 - #{$control-height});
}

.container {
  height: 100%;
}

.router-tab-container {
  background: $theme-bg-color-main;
  border-right: $common-border-sub;
}

.router-view-container {
  padding: 0px;
  margin: 0px;
}

.router-tabs {
  width: 100%;
  height: calc(
    #{$window-height} - #{$shadow-weight} * 2 - #{$control-height} - #{$router-tab-size} -
      #{$router-tab-margin-vertical} * 2 - #{$router-tab-margin-vertical} * 2 -
      #{$router-tab-margin-vertical}
  );
  margin-top: $router-tab-margin-vertical;
  overflow: scroll; // todo: scroll button
}

.router-tabs::-webkit-scrollbar {
  display: none;
  width: 0px;
}

.setting-button {
  margin-top: calc(#{$router-tab-margin-vertical});
  font-size: $router-tab-size;
  width: 100%;
  max-height: calc(#{$router-tab-size} + #{$router-tab-margin-vertical} * 2);
  text-align: center;
  line-height: calc(#{$router-tab-size} + #{$router-tab-margin-vertical} * 2);
  color: $theme-logo-color;
  cursor: pointer;
  .el-icon-s-tools {
    transition: $common-transition;
  }
  &:hover {
    .el-icon-s-tools {
      color: $theme-logo-color-hover;
      transform: rotate(-90deg);
    }
  }
}

.setting-container {
  color: #1e1e1e;
  width: 100%;
  height: 256px;
  font-size: 14px !important;
}

.border-1 {
  font-size: 14px !important;
  line-height: 32px !important;
  text-align: left;
  margin-bottom: 14px;
  width: 50%;
}
</style>
