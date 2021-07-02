"use strict";

class CommonUtils {
  public static getConfigPath(): string {
    const configPath = process.cwd() + "\\config";
    return configPath;
  }

  public static numberArrayIsRepeat(arr: Array<number>): boolean {
    const hash = {};
    for (const i in arr) {
      if (hash[arr[i]]) return true;
      hash[arr[i]] = true;
    }
    return false;
  }

  public static genSettingXml(xmlConfig: any): string {
    let xmlString = `<?xml version="1.0"?>\n<ServerSettings>`;
    for (const label of Object.keys(xmlConfig)) {
      xmlString +=
        "\n" + `\t<property name="${label}" value="${xmlConfig[label]}" />`;
    }
    return xmlString + "\n</ServerSettings>";
  }
}

export default CommonUtils;
