<template>
    <div class="text-container">
        <el-tag :type="props.tag === 'Manager' ? 'default' : 'success'">{{ props.tag }}</el-tag>&nbsp;
        <span class="time">{{ props.time }}</span>
        &nbsp;
        <br />
        <span class="stdout">{{ props.text }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {
        time: {
            type: String,
            default: "Unknown"
        },
        tag: {
            type: String,
            default: "Unknown"
        },
        text: {
            type: String,
            default: "Null"
        }
    },
    setup(props) {
        return { props }
    }
});

</script>

<style lang="scss" scoped>
@import "@/styles/common.scss";

.text-container {
    margin-bottom: 6px;
    font-size: $common-font-size;
    line-height: calc(#{$common-font-size} * 2);
    color: #1e1e1e;
    word-wrap: break-word;
    border-bottom: 1px solid #cacaca;
}

.time {
    color: #888888;
}

.stdout {
    color: #1e1e1e;
}
</style>