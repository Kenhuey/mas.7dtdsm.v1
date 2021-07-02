"use strict";

import { app, protocol, BrowserWindow, Menu, Tray } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import MainIpcs from "@/ipcs/main";
import path from "path";

const MUTI_INSTANCE = app.requestSingleInstanceLock();
if (!MUTI_INSTANCE) {
  app.exit();
}

declare const __static: string;

const iconPath: string = path.join(__static, "favicon.ico");

const isDevelopment = process.env.NODE_ENV !== "production";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

Menu.setApplicationMenu(null);

async function createWindow(): Promise<BrowserWindow> {
  const win: BrowserWindow = new BrowserWindow({
    width: 1080,
    height: 768,
    frame: false,
    resizable: false,
    maximizable: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
  }
  win.on("ready-to-show", function() {
    win.show();
  });
  return win;
}

function createTray(window: BrowserWindow): Tray {
  const trayContextMenu = Menu.buildFromTemplate([
    {
      label: "Display Panel",
      click: () => {
        window.show();
        window.focus();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.exit(); // todo: complete it with !!!QUIT PROCEDURE!!! when all functions finished
      },
    },
  ]);
  const tray = new Tray(iconPath);
  tray.setContextMenu(trayContextMenu);
  tray.setToolTip("mas.7dtdsm");
  return tray;
}

let tray = null;

function initWindow(): void {
  const window: Promise<BrowserWindow> = createWindow();
  window
    .then((resWindow) => {
      tray = createTray(resWindow);
      app.whenReady().then(() => {});
      MainIpcs.init(app, resWindow, tray);
    })
    .catch((error) => {
      console.error(error);
      app.exit();
    });
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) initWindow();
});

app.on("ready", async () => {
  initWindow();
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
