<template>
  <div class="server-config">
    <el-drawer title="Add a config" v-model="addConfigPanelOn" :direction="'rtl'">
      <div class="setting-container">
        <el-select v-model="selectedTemplate" style="width:100%">
          <el-option
            v-for="item in templateConfigs"
            :key="item"
            :label="item['default']['Common']['Version']"
            :value="item"
          ></el-option>
        </el-select>
        <el-button
          style="width: 100%; margin-top: 12px;"
          type="primary"
          @click="createConfigFile"
        >Create</el-button>
      </div>
    </el-drawer>
    <div class="header-bar">
      <span>
        <el-button
          icon="el-icon-delete"
          circle
          class="common-button-size"
          :disabled="fileList.trim() === '' || isSaving"
          @click="deleteConfig"
        ></el-button>
        <el-button
          icon="el-icon-document-add"
          circle
          class="common-button-size"
          :disabled="isSaving"
          @click="createConfig"
        ></el-button>
      </span>
      <el-select
        class="common-margin-left"
        @click="refreshServerConfigPath"
        v-model="fileList"
        @change="selectConfig"
        ref="selectConfigRef"
        :disabled="isSaving"
      >
        <el-option
          v-for="item in fileListOptions"
          :key="item"
          :label="(item.split('\\')[item.split('\\').length - 1]).slice(0, -5)"
          :value="item"
        ></el-option>
      </el-select>
    </div>
    <div class="config-content-container">
      <el-result
        icon="info"
        title="Empty"
        subTitle="Please choose a config :)"
        v-if="JSON.stringify(jsonConfig) === '{}'"
      >
        <template #extra></template>
      </el-result>
      <div class="version-title-bar" v-if="JSON.stringify(jsonConfig) !== '{}'">
        <el-tag type="success">{{ getVersion().trim() === "" ? "Unknown" : getVersion().trim() }}</el-tag>
        <div style="float:right;">"{{ (fileList.split('\\')[fileList.split('\\').length - 1]) }}"</div>
      </div>
      <el-divider v-if="JSON.stringify(jsonConfig) !== '{}'"></el-divider>
      <el-form
        :disabled="isSaving"
        ref="configForm"
        :inline="true"
        :label-position="labelPosition"
        label-width="256px"
        :model="jsonConfig"
      >
        <div v-for="title in Object.keys(jsonConfig)" :key="title">
          <div v-if="title !== 'Common'">
            <div class="text-title">{{ title }}</div>
            <div
              class="options"
              v-for="itemTitle in Object.keys(jsonConfig[title])"
              :key="itemTitle"
            >
              <el-form-item
                :label="itemTitle"
                class="form-item"
                :rules="jsonConfig[title][itemTitle].Rules === undefined || jsonConfig[title][itemTitle].Rules === null ? [] : jsonConfig[title][itemTitle].Rules"
                :prop="getProp(title, itemTitle)"
              >
                <el-input
                  :show-password="(jsonConfig[title][itemTitle].Password !== undefined || jsonConfig[title][itemTitle].Password !== null) ? jsonConfig[title][itemTitle].Password : false"
                  placeholder="null"
                  v-model="jsonConfig[title][itemTitle].Value"
                  v-if="jsonConfig[title][itemTitle].Type === 'String'
                  && jsonConfig[title][itemTitle].Choose === undefined"
                  :disabled="jsonConfig[title][itemTitle].Lock === true ||
                  (typeof (jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]) === typeof (undefined) ? false : !jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]['Value'])"
                  @blur="trimInput(title, itemTitle, jsonConfig[title][itemTitle].Trim)"
                ></el-input>
                <el-select
                  v-model="jsonConfig[title][itemTitle].Value"
                  style="width: 100%;"
                  v-if="jsonConfig[title][itemTitle].Type === 'String'
                  && jsonConfig[title][itemTitle].Choose !== undefined"
                  :disabled="jsonConfig[title][itemTitle].Lock === true ||
                  (typeof (jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]) === typeof (undefined) ? false : !jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]['Value'])"
                >
                  <el-option
                    v-for="chooseItem in jsonConfig[title][itemTitle].Choose"
                    :key="chooseItem"
                    :label="chooseItem"
                    :value="chooseItem"
                  ></el-option>
                </el-select>
                <el-input-number
                  v-model.number="jsonConfig[title][itemTitle].Value"
                  v-else-if="jsonConfig[title][itemTitle].Type === 'Number'"
                  :disabled="jsonConfig[title][itemTitle].Lock === true ||
                  (typeof (jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]) === typeof (undefined) ? false : !jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]['Value'])"
                  :step="1"
                  step-strictly
                  controls-position="right"
                  :precision="0"
                  :min="jsonConfig[title][itemTitle]['Range'] !== undefined ? jsonConfig[title][itemTitle]['Range'][0] : 0"
                  :max="jsonConfig[title][itemTitle]['Range'] !== undefined ? (jsonConfig[title][itemTitle]['Range'][1] == -1 ? 1024000 : jsonConfig[title][itemTitle]['Range'][1]) : 1024000"
                ></el-input-number>
                <el-switch
                  v-model="jsonConfig[title][itemTitle].Value"
                  v-else-if="jsonConfig[title][itemTitle].Type === 'Boolean'"
                  :disabled="jsonConfig[title][itemTitle].Lock === true ||
                  (typeof (jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]) === typeof (undefined) ? false : !jsonConfig[title][jsonConfig[title][itemTitle].EnableFrom]['Value'])"
                ></el-switch>
              </el-form-item>
            </div>
          </div>
        </div>
        <el-form-item
          style="text-align: right;"
          class="form-item"
          v-if="JSON.stringify(jsonConfig) !== '{}'"
        >
          <el-affix position="bottom" :offset="29" target=".config-content-container">
            <el-button @click="clearOpenedConfig(false)">Cancel</el-button>
            <el-button
              type="primary"
              @click="commitConfig"
              :disabled="commitEnable"
              :loading="isSaving"
            >Save</el-button>
          </el-affix>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
      
<script lang="ts">
import { defineComponent, ref, unref, watch, onMounted, Ref } from "vue";
import renderer from "@/ipcs/renderer"
const fs = window.require("fs");
import { ElMessageBox } from 'element-plus';
import CommonUtils from "@/utils/common";

import * as TEMPLATE_A19_X from "@/assets/template/A19.X.json"

export default defineComponent({
  setup() {
    const labelPosition = ref("left");

    const originalConfigJson = ref({});
    const jsonConfig = ref({});
    const targetConfigName = ref("");

    const fileList = ref("");

    const fileListOptions: Ref<Array<string>> = ref([]);

    const selectConfigRef = ref<null | { blur: () => null, focus: () => null }>(null);

    function getPathList() {
      renderer.getServerConfigPath((_event, arg) => {
        fs.readdir(arg, (err: string, files: Array<string>) => {
          if (err) {
            console.error(err);
            return;
          }
          fileListOptions.value = [];
          serverConfigPath.value = arg;
          for (let item of files) {
            if (item.substring(item.length - 5) !== ".json") {
              continue;
            }
            fileListOptions.value.push(arg + "\\" + item);
          }
        })
      });
    }

    function refreshServerConfigPath() {
      const compare =
        (JSON.stringify(unref(jsonConfig)) !== JSON.stringify(unref(originalConfigJson)));
      if (compare) {
        selectConfigRef.value?.blur();
        ElMessageBox
          .confirm('Seems your have a editing config not save yet, abandon it?')
          .then(() => {
            clearOpenedConfig(true);
            getPathList();
            selectConfigRef.value?.focus();
          })
          .catch(() => {
            return;
          });
      }
      else {
        getPathList();
      }
    }

    function selectConfig() {
      fs.readFile(fileList.value, (err: string, data: Buffer) => {
        if (err) {
          console.error(err);
          return;
        }
        originalConfigJson.value = JSON.parse(data.toString());
        jsonConfig.value = JSON.parse(data.toString());
        writeXMLConfig();
      })
    }

    function deleteConfig() {
      ElMessageBox
        .confirm('Are you sure to delete this config?')
        .then(() => {
          fs.unlink(fileList.value, (_err: string) => {
            if (_err) {
              console.trace(_err);
              ElMessageBox.alert("JSON deletion not success, something wrong.");
              return;
            }
            clearConfig();
          });
          let xmlFilename = fileList.value.split("\\")[fileList.value.split('\\').length - 1];
          xmlFilename = xmlFilename.substring(0, xmlFilename.length - 5)
          fs.unlink(serverConfigPath.value + "\\xml\\" + xmlFilename + ".xml", (_err: string) => {
            if (_err) {
              console.trace(_err);
              ElMessageBox.alert("XML deletion not success, something wrong.");
              return;
            }
            clearConfig();
          });
        })
        .catch(() => {
          return;
        });
    }

    const templateConfigs = ref(
      [
        JSON.parse(JSON.stringify(TEMPLATE_A19_X))
      ]
    );

    const addConfigPanelOn = ref(false);

    function createConfig() {
      addConfigPanelOn.value = true;
    }

    const serverConfigPath = ref("");

    const selectedTemplate = ref(templateConfigs.value[0]);

    function writeConfigFile() {
      const filename = Date.now();
      fs.writeFile(serverConfigPath.value + `\\${filename}.json`, JSON.stringify(selectedTemplate.value["default"], null, 4), 'utf8', (_err: string) => {
        if (_err) {
          console.trace(_err);
          ElMessageBox.alert("Cannot create a config, seems something wrong.");
          return;
        }
        addConfigPanelOn.value = false;
        refreshServerConfigPath();
        fileList.value = serverConfigPath.value + `\\${filename}.json`;
        selectConfig();
        isSaving.value = true;
        setTimeout(() => {
          isSaving.value = false;
        }, 500);
      });
    }

    function createConfigFile() {
      if (fileList.value !== "" && fileList.value !== undefined && fileList.value !== null && !commitEnable.value) {
        ElMessageBox
          .confirm('Seems your have a editing config not save yet, abandon it?')
          .then(() => {
            clearConfig();
            writeConfigFile();
          })
          .catch(() => {
            return;
          });
        return;
      }
      writeConfigFile();
    }

    function getProp(title: string, itemTitle: string): string {
      return `${title}.${itemTitle}.Value`;
    }

    function trimInput(
      title: string,
      itemTitle: string,
      trim: boolean | undefined | null
    ) {
      if (trim !== undefined || trim !== null) {
        if (jsonConfig.value[title][itemTitle].Trim) {
          try {
            jsonConfig.value[title][itemTitle].Value =
              jsonConfig.value[title][itemTitle].Value.replace(/^\s*/g, '');
            jsonConfig.value[title][itemTitle].Value =
              jsonConfig.value[title][itemTitle].Value.replace(/\s* $/g, '')
          } catch (err) {
            return err;
          }
        }
      }
    }

    function getVersion() {
      let version = null;
      try {
        version = jsonConfig.value['Common'].Version;
      }
      catch (err) {
        console.warn(`Config file seems not selected. <${err}>`)
      }
      return version;
    }

    const configForm = ref<null | { validate: (valid: (_valid: boolean) => void) => null }>(null);

    const isSaving = ref(false);

    function writeXMLConfig() {
      let xmlConfig = {};
      for (let title of Object.keys(jsonConfig.value)) {
        if (title === "Common") {
          continue;
        }
        for (let configTitle of Object.keys(jsonConfig.value[title])) {
          xmlConfig[configTitle] = unref(jsonConfig.value[title][configTitle]["Value"])
        }
      }
      const xmlConfigString = CommonUtils.genSettingXml(xmlConfig);
      let xmlFilename = fileList.value.split("\\")[fileList.value.split('\\').length - 1];
      xmlFilename = xmlFilename.substring(0, xmlFilename.length - 5)
      fs.writeFile(serverConfigPath.value + "\\xml\\" + xmlFilename + ".xml", xmlConfigString, "utf8", (_err: string) => {
        if (_err) {
          console.trace(_err);
          setTimeout(() => {
            isSaving.value = false;
            ElMessageBox.alert(`JSON file create succeed but XML file create fail.`);
          }, 500);
          return;
        }
        console.log(`XML Save success: ` + serverConfigPath.value + "\\xml\\" + xmlFilename + ".xml")
        setTimeout(() => {
          isSaving.value = false;
        }, 500);
      });
    }

    function commitConfig() {
      configForm.value?.validate((_valid: boolean) => {
        if (!_valid) {
          return;
        }
        const nEqualList: Array<Array<string>> = unref(jsonConfig.value["Common"]['NotAllowEqual']);
        for (let item of nEqualList) {
          let tempItemList = [];
          for (let fields of item) {
            tempItemList.push(jsonConfig.value[fields[0]][fields[1]]["Value"])
          }
          if (CommonUtils.numberArrayIsRepeat(tempItemList)) {
            ElMessageBox.alert(`Some ports cannot be same: [${tempItemList}]`);
            return;
          }
        }
        isSaving.value = true;
        fs.writeFile(fileList.value, JSON.stringify(jsonConfig.value, null, 4), 'utf8', (_err: string) => {
          if (_err) {
            console.trace(_err);
            isSaving.value = false;
            return;
          }
          console.log(`Save success: "${fileList.value}"`)
          jsonConfig.value = JSON.parse(JSON.stringify(jsonConfig.value, null, 4));
          originalConfigJson.value = JSON.parse(JSON.stringify(jsonConfig.value, null, 4));
          writeXMLConfig();
        })
      });
    }

    const commitEnable = ref(false);

    function commitEnableCheck() {
      const compare =
        (JSON.stringify(unref(jsonConfig)) == JSON.stringify(unref(originalConfigJson)));
      if (compare) {
        commitEnable.value = compare;
        return;
      }
      configForm.value?.validate((_valid: boolean) => {
        commitEnable.value = !_valid;
      });
    }

    watch(() => jsonConfig.value, () => {
      commitEnableCheck();
    }, { deep: true });

    onMounted(() => {
      commitEnableCheck();
      refreshServerConfigPath();
    })

    function delaySaving(_call: () => void) {
      isSaving.value = true;
      setTimeout(() => {
        _call();
        isSaving.value = false;
      }, 500);
    }

    function clearConfig() {
      jsonConfig.value = {};
      originalConfigJson.value = {};
      fileList.value = "";
    }

    function clearOpenedConfig(notPop: boolean) {
      if (notPop) {
        delaySaving(clearConfig);
        return;
      }
      if (commitEnable.value) {
        delaySaving(clearConfig);
        return;
      }
      ElMessageBox
        .confirm('Seems the config not saved, are you sure to calcel?')
        .then(() => {
          delaySaving(clearConfig);
        })
        .catch(() => {
          return;
        });
    }

    return {
      labelPosition,
      jsonConfig,
      targetConfigName,
      getProp,
      trimInput,
      getVersion,
      configForm,
      commitConfig,
      commitEnable,
      clearOpenedConfig,
      fileList,
      fileListOptions,
      templateConfigs,
      refreshServerConfigPath,
      deleteConfig,
      selectConfig,
      selectConfigRef,
      isSaving,
      createConfig,
      addConfigPanelOn,
      selectedTemplate,
      createConfigFile
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/styles/common.scss";

.server-config {
  padding: $router-tab-margin-vertical;
  line-height: 26px !important;
  font-size: $common-button-icon-size;
  color: $common-font-color !important;
}

.header-bar {
  margin-bottom: $router-tab-margin-vertical;
  text-align: right;
  user-select: none;
}

.version-tag {
  margin-right: $router-tab-margin-vertical;
}

.config-content-container {
  background: $theme-bg-color-main;
  border-radius: calc(#{$common-border-radius} / 2);
  padding: $router-tab-margin-vertical;
}

.version-title-bar {
  width: 100%;
  text-align: left;
  user-select: none;
  line-height: calc(#{$common-title-font-size} * 2);
}

.options {
  margin-bottom: calc(#{$common-title-font-size} / 2);
}

.form-item {
  width: 100%;
  user-select: none;
}
</style>
