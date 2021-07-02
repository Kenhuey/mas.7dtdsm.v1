<template>
    <div class="router-tab" @click="routerDirectTo" :class="isActive">
        <div :class="iconClass"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent, watch, onMounted, ref } from "vue";
import { useRouter, useRoute, Router } from 'vue-router'

export default defineComponent({
    props: {
        path: {
            type: String,
            default: ""
        },
        iconClass: {
            type: String,
            default: "el-icon-question"
        }
    },
    setup(props) {
        const router: Router = useRouter();
        const route = useRoute();

        function routePathIsExist(): boolean {
            let pathExistFlag = false;
            for (let routePath of router.options.routes) {
                if (routePath.path == props.path) {
                    pathExistFlag = true;
                    break;
                }
            }
            return pathExistFlag;
        }

        function routerDirectTo() {
            if (route.path === props.path) {
                return;
            }
            if (props.path !== "" || props.path !== null || props.path !== undefined) {
                if (routePathIsExist()) {
                    router.push(props.path);
                    return;
                }
                throw new Error(`The path < ${props.path} > not exist.`);
            }
            throw new Error(`The path < ${props.path} > not available.`);
        }

        const isActive = ref("");

        function checkIsAcvive() {
            if (route.path === props.path) {
                isActive.value = "is-active";
            }
            else {
                isActive.value = "not-active";
            }
        }

        onMounted(() => {
            checkIsAcvive();
        })

        watch(() => route.path, () => {
            checkIsAcvive();
            // todo: Need to fix this bug, the watcher call twice when route jumped.
        })

        return {
            routerDirectTo,
            isActive
        }
    }
});

</script>

<style lang="scss" scoped>
@import "@/styles/common.scss";

.router-tab {
    user-select: none;
    width: 100%;
    height: calc(#{$router-tab-size} + #{$router-tab-margin-vertical} * 2);
    font-size: $router-tab-size;
    width: 100%;
    max-height: calc(#{$router-tab-size} + #{$router-tab-margin-vertical} * 2);
    text-align: center;
    line-height: calc(#{$router-tab-size} + #{$router-tab-margin-vertical} * 2);
    color: $theme-logo-color;
    cursor: pointer;
    transition: $common-transition;
    &:hover {
        color: $theme-logo-color-hover;
    }
    &:active {
        color: $theme-color-primary-deep;
    }
}

.not-active {
    color: $theme-logo-color;
}

.is-active {
    $color: $theme-logo-color-hover;
    color: $theme-logo-color-hover;
    background: $theme-color-primary-sub;
    color: $color;
    cursor: default;
    &:hover {
        color: $color;
    }
}
</style>