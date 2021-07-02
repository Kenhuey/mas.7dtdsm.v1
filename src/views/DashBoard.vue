<template>
  <div>
    <div class="main-container">
      <el-scrollbar>
        <div class="item">
          <span class="text-title">Console</span>
        </div>
        <div class="item">
          <div class="console-container">
            <el-scrollbar ref="consoleScrollRef">
              <div style="padding: 12px;">
                <logger-text
                  v-for="item in consoleTexts"
                  :key="item.tag"
                  :time="item.time"
                  :tag="item.tag"
                  :text="item.text"
                ></logger-text>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <div class="inner-container">
      <el-scrollbar>
        <div class="item">
          <span class="text-title">Status</span>
        </div>
        <div class="item">
          <el-select
            class="start-select"
            v-model="configFileList"
            @click="refreshServerConfigPath"
            :disabled="serverCurrerentProcess !== null"
            placeholder="Choose your config."
          >
            <el-option
              v-for="item in fileListOptions"
              :key="item"
              :label="(item.split('\\')[item.split('\\').length - 1]).slice(0, -5)"
              :value="item"
            ></el-option>
          </el-select>
          <el-button
            v-if="serverCurrerentProcess === null"
            icon="el-icon-caret-right"
            style="float: right;"
            @click="startServer"
          ></el-button>
          <el-button
            v-if="serverCurrerentProcess !== null"
            icon="el-icon-close"
            type="danger"
            style="float: right;"
            @click="stopServer"
            plain
          ></el-button>
        </div>
        <div class="item">
          <el-card shadow="never">
            <template #header>
              <span style="font-weight: bold; font-size: 14px;">Server</span>
              <el-tag
                :type="serverCurrerentProcess !== null ? 'success' : 'warning'"
                style="float: right;"
              >{{ serverCurrerentProcess !== null ? 'Running' : 'Suspended' }}</el-tag>
            </template>
            <table class="info-tab">
              <tr>
                <td>Players</td>
                <td>{{ playerCount }}/{{ playerMax }}</td>
              </tr>
              <tr>
                <td>Local IP</td>
                <td>{{ getIPAdress() }}{{ serverPort === 0 ? '' : `:${serverPort}` }}</td>
              </tr>
            </table>
          </el-card>
        </div>
        <div class="item">
          <span class="text-title">Hardware Usage</span>
        </div>
        <div class="item">
          <table class="dashboard-tab" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div class="dashboard-panel-small">
                  <el-card shadow="never" style="text-align: center;">
                    <n-progress
                      type="circle"
                      :percentage="parseFloat(memoryUsage.percentage.toFixed(2))"
                      class="progress-bar"
                    >
                      <span style="text-align: center;">
                        MEM
                        <br />
                        <span>{{ parseFloat(memoryUsage.now.toFixed(2)) }}G</span>
                      </span>
                    </n-progress>
                  </el-card>
                </div>
              </td>
              <td>
                <div class="dashboard-panel-small">
                  <el-card shadow="never" style="text-align: center;">
                    <n-progress
                      type="circle"
                      :percentage="parseFloat(cpuUsage.toFixed(2))"
                      class="progress-bar"
                    >
                      <span style="text-align: center;">
                        CPU
                        <br />
                        <span>{{ parseFloat(cpuUsage.toFixed(2)) }}%</span>
                      </span>
                    </n-progress>
                  </el-card>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts">
import LoggerText from "@/components/LoggerText.vue"
import { defineComponent, Ref, ref, unref, onMounted, toRaw } from "vue";
import IpcRenderer from "@/ipcs/renderer"
const fs = window.require("fs");
const child_process = window.require('child_process');
import { ElMessageBox } from 'element-plus';
import { ElScrollbar } from "element-plus";
import RendererIpcs from "@/ipcs/renderer"
import defaultSetting from "@/assets/setting";
const Store = window.require("electron-store");

const TASK_TIMEOUT = 1500;
const os = window.require('os');

function getIPAdress() {
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

export default defineComponent({
  components: { LoggerText },
  setup() {
    const cpuUsage: Ref<number> = ref(0);

    IpcRenderer.getCpuUsage((_event, result) => {
      cpuUsage.value = Number(result);
    })

    setInterval(() => {
      IpcRenderer.getCpuUsage((_event, result) => {
        cpuUsage.value = Number(result);
      })
    }, TASK_TIMEOUT);

    IpcRenderer.getMemUsage((_event, result: {
      now: number,
      percentage: number
    }) => {
      memoryUsage.value.percentage = Number(result.percentage);
    })

    const memoryUsage: Ref<{ now: number, percentage: number }> = ref({
      now: 0,
      percentage: 0
    })

    setInterval(() => {
      IpcRenderer.getMemUsage((_event, result) => {
        memoryUsage.value.percentage = Number(result.percentage);
        memoryUsage.value.now = Number(result.now);
      })
    }, TASK_TIMEOUT);

    const configFileList = ref("");

    const fileListOptions: Ref<Array<string>> = ref([]);

    function refreshServerConfigPath() {
      IpcRenderer.getServerConfigPath((_event, arg) => {
        fs.readdir(arg + "\\xml", (err: string, files: Array<string>) => {
          if (err) {
            console.trace(err);
            return;
          }
          fileListOptions.value = [];
          let fileExistFlag = false;
          for (let item of files) {
            if (item.substring(item.length - 4) !== ".xml") {
              continue;
            }
            const _temp = configFileList.value;
            if (_temp === `${configFileList.value}`) {
              fileExistFlag = true;
            }
            fileListOptions.value.push(arg + "\\xml\\" + item);
          }
          if (!fileExistFlag) {
            configFileList.value = unref("");
          }
        })
      });
    }

    function getTime(): string {
      const date = new Date();
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    const consoleTexts = ref([
      {
        time: unref(getTime()),
        tag: "Manager",
        text: "Thanks for using this little tool:)"
      }
    ])

    let cfgStore: { get: (_arg: string) => any, set: (_arg: string, _arg2: any) => void };

    const steamCmdPath = ref("")
    const configPath = ref("");

    function syncSetting(_call: () => void) {
      RendererIpcs.getServerConfigPath2((_event, path) => {
        configPath.value = path;
        if (cfgStore === undefined) {
          cfgStore = new Store({
            schema: defaultSetting,
            cwd: configPath.value,
          });
        }
        steamCmdPath.value = toRaw(cfgStore.get("steamCmdPath") as string);
        _call();
      });
    }

    const serverCurrerentProcess = ref<{ kill: () => void } | null>(null);

    let serverCurrerentProcessCall: any = null;

    function createServer(path: string) {
      consoleTexts.value.push({
        time: unref(getTime()),
        tag: "Manager",
        text: `Game server: "${path}"`
      });
      const serverProcess = child_process.spawn(path, ["-quit", "-batchmode", "-nographics", "-configfile=7dtdsm.xml", "–dedicated"]);
      serverCurrerentProcess.value = serverProcess;
      serverCurrerentProcessCall = serverProcess;
      getPort();
      serverProcess.stdout.on('data', (data: string) => {
        consoleTexts.value.push({
          time: unref(getTime()),
          tag: "Server",
          text: `${data}`
        });
        scrollToBottomConsole();
      });
      serverProcess.on('close', (code: string) => {
        consoleTexts.value.push({
          time: unref(getTime()),
          tag: "Manager",
          text: `Server closed: ${code}`
        });
        serverCurrerentProcessCall = null;
        serverCurrerentProcess.value = null;
        serverPort.value = 0;
        scrollToBottomConsole();
      });
    }

    const serverPort = ref(0);

    function getPort() {
      fs.readFile(steamCmdPath.value + "\\steamapps\\common\\7 Days to Die Dedicated Server\\7dtdsm.xml", (err: string, data: any) => {
        if (err) {
          console.trace(err);
          return;
        }
        const xml2js = window.require('xml2js');
        xml2js.parseString(data.toString(), function(_err: string, result: any) {
          if (_err) {
            console.trace(_err);
            return;
          }
          for (let item of result.ServerSettings.property) {
            if (item.$.name === "ServerPort") {
              serverPort.value = item.$.value;
            }
          }
        });
      });
    }

    function updateGame(_call: () => void) {
      const steamcmdProcess = child_process.spawn(steamCmdPath.value + "\\steamcmd.exe", ["+login", "anonymous", "+app_update", "294420", "validate", "+quit"]);
      consoleTexts.value.push({
        time: unref(getTime()),
        tag: "Manager",
        text: `SteamCMD path: "${steamCmdPath.value}"`
      });
      consoleTexts.value.push({
        time: unref(getTime()),
        tag: "Manager",
        text: `Server args: "${steamCmdPath.value}"`
      });
      consoleTexts.value.push({
        time: unref(getTime()),
        tag: "Manager",
        text: `Game downloading/updating, please wait :)`
      });
      steamcmdProcess.stdout.on('data', (data: string) => {
        consoleTexts.value.push({
          time: "",
          tag: "SteamCMD",
          text: `${data}`
        });
        scrollToBottomConsole();
      });
      steamcmdProcess.on('close', (code: string) => {
        consoleTexts.value.push({
          time: unref(getTime()),
          tag: "Manager",
          text: `Download finished: ${code}`
        });
        _call();
        scrollToBottomConsole();
      });
    }

    function startServer() {
      syncSetting(() => {
        if (configFileList.value === "") {
          ElMessageBox.alert("Please select a xml config to start the server.");
          return;
        }
        consoleTexts.value.push({
          time: unref(getTime()),
          tag: "Manager",
          text: `SteaCMD path: "${steamCmdPath.value}"`
        });
        let path = steamCmdPath.value + "\\steamapps\\common\\7 Days to Die Dedicated Server\\7DaysToDieServer.exe";
        fs.access(path, fs.constants.F_OK, (_err: string) => {
          if (_err) {
            console.trace(_err);
            ElMessageBox
              .confirm('Seems your game have not download yet, download?')
              .then(() => {
                fs.access(steamCmdPath.value + "\\steamcmd.exe", fs.constants.F_OK, (_err: string) => {
                  if (_err) {
                    ElMessageBox.alert("steamcmd.exe not exist!");
                    return;
                  }
                  updateGame(() => { return; });
                });
              })
              .catch(() => {
                return;
              });
            return;
          }
          else {
            try {
              fs.copyFileSync(configFileList.value, steamCmdPath.value + "\\steamapps\\common\\7 Days to Die Dedicated Server\\7dtdsm.xml");
            } catch (_err) {
              console.trace(_err);
              consoleTexts.value.push({
                time: unref(getTime()),
                tag: "Manager",
                text: `XML file copy fail.`
              });
              return;
            }
            updateGame(() => { createServer(path); });
          }
        });
      });
    }

    function scrollToBottomConsole() {
      setTimeout(() => {
        consoleScrollRef.value.wrap.scrollTop = consoleScrollRef.value.wrap.scrollHeight;
      }, 100);
    }

    const consoleScrollRef = ref(ElScrollbar);

    const playerCount = ref(0);
    const playerMax = ref("Unknown");

    onMounted(() => {
      setInterval(updatePlayerCount, 2000);
      return;
    });

    function updatePlayerCount() {
      syncSetting(() => {
        IpcRenderer.getServerInfo({
          ip: "127.0.0.1", // cannot use LAN ip
          port: Number(serverPort.value.toString())
        }, (_event, serverInfo) => {
          playerCount.value = serverInfo.numberOfPlayers;
          playerMax.value = serverInfo.maxNumberOfPlayers;
        })
      });
    }

    function stopServer() {
      if (serverCurrerentProcess.value !== null) {
        serverCurrerentProcessCall.kill();
        serverCurrerentProcessCall = null;
        serverCurrerentProcess.value = null;
        serverPort.value = 0;
      }
    }

    return {
      cpuUsage,
      memoryUsage,
      configFileList,
      refreshServerConfigPath,
      fileListOptions,
      startServer,
      consoleTexts,
      consoleScrollRef,
      serverCurrerentProcess,
      stopServer,
      getIPAdress,
      getPort,
      serverPort,
      playerCount,
      playerMax,
      updatePlayerCount
    }
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/common.scss";

$inner-width: 300px;

$all-width: 1004px;

.main-container {
  float: left;
  width: calc(#{$all-width} - #{$inner-width});
  height: 699px;
}

.inner-container {
  width: calc(#{$inner-width} - 1px);
  background-color: $theme-bg-color-container-inner;
  float: right;
  border-left: 1px solid $theme-border-color-inner;
  height: 699px;
}

.info-tab {
  font-size: $common-font-size !important;
  width: 100%;
  tr {
    width: 100%;
    td:first-child {
      text-align: left;
    }
    td:last-child {
      text-align: right;
    }
  }
}

.dashboard-panel-small {
  border-radius: $common-border-radius !important;
  width: 120px;
}

.dashboard-tab {
  border: none;
  width: 100%;
  font-size: $common-font-size !important;
  tr {
    width: 100%;
    td:first-child .dashboard-panel-small {
      float: left;
    }
    td:last-child .dashboard-panel-small {
      float: right;
    }
  }
}

.progress-bar {
  width: 100%;
  height: 100%;
  margin: 0 auto;
}

.start-select {
  width: calc(100% - 44px - 12px);
}

.console-container {
  width: 100%;
  height: 618px;
  border-radius: 4px;
  background: $theme-bg-color-main;
  word-wrap: break-word;
  word-break: normal;
  box-sizing: border-box;
  border: 1px solid $theme-bg-color-container-inner;
  user-select: text;
}
</style>
