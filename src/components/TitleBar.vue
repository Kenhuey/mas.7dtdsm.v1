<template>
    <div class="title-bar">
        <div class="title text-over-length-hidden">mas.7dtdsm</div>
        <div class="control-button-coaintainer">
            <div class="control-button" id="button-close" @click="closeWnd">
                <div class="el-icon-close" id="icon-close"></div>
            </div>
            <div class="control-button" id="button-minimize" @click="RendererIpcs.windowMinimize">
                <div class="el-icon-minus" id="icon-minimize"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RendererIpcs from "@/ipcs/renderer"

export default defineComponent(
    {
        props: ['_closeCall'],
        setup(props) {
            function closeWnd() {
                if (props._closeCall !== undefined) {
                    props._closeCall(RendererIpcs.windowTray)
                }
                else {
                    RendererIpcs.windowTray()
                }
            }
            return {
                closeWnd,
                RendererIpcs
            }
        }
    }
);
</script>
  
<style lang="scss" scoped>
@import "@/styles/common.scss";

.title-bar {
    height: calc(#{$control-content-height} - #{$common-border-weight-main});
    line-height: $control-content-height;
    background-color: $theme-bg-color-main;
    overflow: hidden;
    clear: both;
    -webkit-app-region: drag;
    border-bottom: $common-border-main;
    padding-left: $layout-margin;
    padding-right: $layout-margin;
    padding-top: $inner-margin;
    padding-bottom: $inner-margin;
    user-select: none;
    color: $theme-font-color;
    font-size: $common-font-size;
}

.title {
    line-height: calc(
        #{$control-content-height} - #{$common-border-weight-main}
    );
    // font-size: $common-title-font-size;
    width: calc(100% - #{$common-title-font-size} * 6);
    float: left;
}

.control-button-coaintainer {
    float: right;
    width: calc(#{$common-title-font-size} * 6);
    -webkit-app-region: none;
}

.control-button {
    float: right;
    height: 100%;
    width: calc(#{$common-title-font-size} * 3);
    font-size: $common-font-size-sub;
    line-height: calc(
        #{$control-content-height} - #{$common-border-weight-main}
    );
    text-align: center;
    cursor: pointer;
}

#button-close {
    #icon-close {
        transition: $common-transition;
    }
    &:hover #icon-close {
        color: $theme-color-danger-deep;
        transform: rotate(90deg);
    }
    &:active #icon-close {
        color: $theme-color-danger;
    }
}

#button-minimize {
    #icon-minimize {
        transition: $common-transition;
    }
    &:hover #icon-minimize {
        color: $theme-logo-color-hover;
        transform: translateY(calc(#{$common-font-size-sub} / 3));
    }
    &:active #icon-minimize {
        color: $theme-color-primary-deep;
    }
}
</style>
    