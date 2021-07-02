"use strict";

const ipcRenderer = window.require("electron").ipcRenderer;
import Execs from "@/ipcs/execs";

class RendererIpcs {
  public static processExit(): void {
    ipcRenderer.send(Execs.EXEC_PROCESS_EXIT);
  }

  public static windowTray(): void {
    ipcRenderer.send(Execs.EXEC_WINDOW_TRAY);
  }

  public static windowMinimize(): void {
    ipcRenderer.send(Execs.EXEC_WINDOW_MINIMIZE);
  }

  public static getServerConfigPath(
    _result: (event: Electron.IpcRendererEvent, arg: string) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_SERVER_CONFIG_PATH);
    ipcRenderer.once(Execs.EXEC_GET_SERVER_CONFIG_PATH_REPLY, _result);
  }

  public static getServerConfigPath2(
    _result: (event: Electron.IpcRendererEvent, arg: string) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_SERVER_CONFIG_PATH_2);
    ipcRenderer.once(Execs.EXEC_GET_SERVER_CONFIG_PATH_REPLY_2, _result);
  }

  public static getPath(
    name: string,
    _result: (event: Electron.IpcRendererEvent, arg: string) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_PATH, name);
    ipcRenderer.once(Execs.EXEC_GET_PATH_REPLY, _result);
  }

  public static getFolderDialog(
    _result: (event: Electron.IpcRendererEvent, arg: string) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_OPEN_FOLDER_DIALOG);
    ipcRenderer.once(Execs.EXEC_OPEN_FOLDER_DIALOG_REPLY, _result);
  }

  public static getCpuUsage(
    _result: (event: Electron.IpcRendererEvent, arg: string) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_CPU_USAGE);
    ipcRenderer.once(Execs.EXEC_GET_CPU_USAGE_REPLY, _result);
  }

  public static getMemUsage(
    _result: (
      event: Electron.IpcRendererEvent,
      arg: {
        now: number;
        percentage: number;
      }
    ) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_MEM_USAGE);
    ipcRenderer.once(Execs.EXEC_GET_MEM_USAGE_REPLY, _result);
  }

  public static getServerInfo(
    arg: {
      ip: string;
      port: any;
    },
    _result: (event: Electron.IpcRendererEvent, arg: any) => void
  ): void {
    ipcRenderer.send(Execs.EXEC_GET_SERVER_INFO, arg);
    ipcRenderer.once(Execs.EXEC_GET_SERVER_INFO_REPLY, _result);
  }
}

export default RendererIpcs;
