"use strict";

const defaultSetting = {
  noticeCloseWindow: {
    type: "boolean",
    default: true,
  },
  language: {
    type: "string",
    default: "en",
  },
  steamCmdPath: {
    type: "string",
    default: "",
  },
} as const;

export default defaultSetting;
