# mas.7dtdsm 1.0.0 (7 Days To Die 开服小工具)

## 需知

该项目已废弃并转移到v2版本(开发中): https://github.com/Kenhuey/mas.7dtdsm.v2

## Stacks 开发基于

NodeJS/Typescript

Vue3/Electron

## Functions 功能

- Basics config file management 服务器配置文件简易管理
- Easily setup server and start(vanilla server) 傻瓜式一键开服（原版）
- Easily download SteamCMD and game server 无需手动下载 STEAMCMD 和服务器，在 UI 操作即可

## Release 运行程序

打开后点击左下角齿轮设置 SteamCMD 路径

或者点下载按钮安装到一个新的空目录内之后选择新目录

然后点击第二个页面创建一个 A19.X 的配置

接着回到主面板选择配置文件开启服务器即可（如果没下载会有提示可以自动下载，每次开启都会调用一次 SteamCMD 检查更新）

图文使用方式：https://blog.csdn.net/u010563056/article/details/118422695?spm=1001.2014.3001.5501

## Project setup 项目代码

Setup 运行项目

```
git clone https://github.com/Kenhuey/mas.7dtdsm.git
yarn install
yarn electron:serve
```

Build 打包成 EXE

```
yarn electron:build
```

## Refactor plan 重构计划 2.0.0

ES6 standard codes and modularization core 代码完全规范 ES6 且模组化核心代码

Web control panel 集成 WEB 端插件

Fully logger 完整的日志系统

Cluster manager 集群管理

Frp tools 集成 FRP 穿透

Task 计划任务

Muti-Platform GUI 多平台 GUI 支持

RCON managerment RCON 管理

Mods/plugin managerment 插件/MOD 管理

Muti-Version managerment 服务器多版本管理（STEAMCMD）

I18N 多语言

Design a better UI 重新设计 UI
