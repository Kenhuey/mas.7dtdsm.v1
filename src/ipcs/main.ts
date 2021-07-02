"use strict";

import { ipcMain, App, BrowserWindow, Tray, dialog } from "electron";
import Store from "electron-store";
import Execs from "@/ipcs/execs";
import defaultSetting from "@/assets/setting";
import CommonUtils from "@/utils/common";
const os = require("os-utils");
const steamServerStatus = require("steam-server-status");

class MainIpcs {
  public static init(app: App, window: BrowserWindow, tray: Tray): void {
    const store = new Store({
      schema: defaultSetting,
      cwd: CommonUtils.getConfigPath(),
    });

    console.log(
      `Program setting config: ${JSON.stringify(store.store, null, 4)}`
    );

    const serverStore = new Store({
      cwd: CommonUtils.getConfigPath() + "\\server",
    });

    const serverXmlStore = new Store({
      cwd: CommonUtils.getConfigPath() + "\\server\\xml",
    });

    console.log(
      `Server config file path: \"${serverStore.path.substring(
        0,
        serverStore.path.length - 12
      )}\"`
    );

    console.log(
      `Server xml config file path: \"${serverXmlStore.path.substring(
        0,
        serverXmlStore.path.length - 12
      )}\"`
    );

    ipcMain.on(Execs.EXEC_GET_SERVER_CONFIG_PATH, (event) => {
      event.reply(
        Execs.EXEC_GET_SERVER_CONFIG_PATH_REPLY,
        CommonUtils.getConfigPath() + "\\server"
      );
    });

    ipcMain.on(Execs.EXEC_GET_SERVER_CONFIG_PATH_2, (event) => {
      event.reply(
        Execs.EXEC_GET_SERVER_CONFIG_PATH_REPLY_2,
        CommonUtils.getConfigPath()
      );
    });

    app.on("second-instance", () => {
      window.focus();
    });

    tray.on("double-click", () => {
      window.show();
      window.focus();
    });

    ipcMain.on(Execs.EXEC_PROCESS_EXIT, () => {
      app.exit();
    });

    ipcMain.on(Execs.EXEC_WINDOW_TRAY, () => {
      window.hide();
    });

    ipcMain.on(Execs.EXEC_WINDOW_MINIMIZE, () => {
      window.minimize();
    });

    ipcMain.on(Execs.EXEC_GET_PATH, (event, arg) => {
      if (arg === "app") {
        event.reply(Execs.EXEC_GET_PATH_REPLY, app.getAppPath());
        return;
      } else if (arg === "process") {
        event.reply(Execs.EXEC_GET_PATH_REPLY, process.cwd());
        return;
      }
      event.reply(Execs.EXEC_GET_PATH_REPLY, app.getPath(arg));
    });

    ipcMain.on(Execs.EXEC_OPEN_FOLDER_DIALOG, (event) => {
      const result: Array<string> | undefined = dialog.showOpenDialogSync(
        window,
        {
          properties: ["openDirectory"],
        }
      );
      if (result !== undefined) {
        event.reply(Execs.EXEC_OPEN_FOLDER_DIALOG_REPLY, result[0]);
      }
    });

    ipcMain.on(Execs.EXEC_GET_CPU_USAGE, (event) => {
      os.cpuUsage(function(cpuPercentage: number) {
        event.reply(Execs.EXEC_GET_CPU_USAGE_REPLY, cpuPercentage * 100);
      });
    });

    ipcMain.on(Execs.EXEC_GET_MEM_USAGE, (event) => {
      event.reply(Execs.EXEC_GET_MEM_USAGE_REPLY, {
        now: (os.totalmem() - os.freemem()) / 1024,
        percentage: 100 - os.freememPercentage() * 100,
      });
    });

    ipcMain.on(
      Execs.EXEC_GET_SERVER_INFO,
      (
        event,
        arg: {
          ip: string;
          port: number;
        }
      ) => {
        const argCopy = JSON.parse(JSON.stringify(arg));
        const ip = argCopy.ip;
        const port = argCopy.port;
        replyGetServerInfo(event, ip, port);
      }
    );
  }
}

function replyGetServerInfo(event: any, ip: string, _port: number) {
  try {
    const port: number = _port;
    steamServerStatus.getServerStatus(ip, port, (serverInfo: any) => {
      if (serverInfo.error === undefined) {
        event.reply(Execs.EXEC_GET_SERVER_INFO_REPLY, {
          numberOfPlayers: serverInfo.numberOfPlayers,
          maxNumberOfPlayers: serverInfo.maxNumberOfPlayers,
        });
      }
    });
  } catch (_err) {
    return;
  }
}

export default MainIpcs;
