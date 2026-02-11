<template>
    <Transition name="fadeDown">
        <div class="physton-prompt-hotkey" v-if="isOpen" @click="onCloseClick">
        <div class="hotkey-main" @click.stop>
            <div class="hotkey-popup-close" @click="onCloseClick">
                <icon-svg name="close"/>
            </div>
            <div class="hotkey-body" @click.stop>
                <div class="hotkey-list">
                    <div class="hotkey-item" v-for="(hotkey) in hotkeys" :key="hotkey.name">
                        <div class="hotkey-title">{{ getLang(hotkey.title) }}</div>
                        <select class="hotkey-select" v-model="hotkey.value">
                            <option v-for="(option) in hotkey.options" :key="option.name" :value="option.name">{{ getLang(option.title) }}</option>
                        </select>
                    </div>
                </div>
                <div class="setting-btns">
                    <div class="hotkey-save hover-scale-120" @click="onSaveClick">{{ getLang('save') }}</div>
                    <div class="hotkey-close hover-scale-120" @click="onCloseClick">{{ getLang('close') }}</div>
                </div>
            </div>
        </div>
    </div>
    </Transition>
</template>
<script>
import IconSvg from "@/components/iconSvg.vue";
import common from "@/utils/common";

export default {
    name: 'Hotkey',
    components: {IconSvg},
    props: {
        defaultHotkey: {
            type: Object,
            default: () => ({}),
        }
    },
    data() {
        return {
            isOpen: false,
            hotkeys: [
                {
                    name: 'click',
                    title: 'left_click_keyword_tag',
                    value: '',
                    options: [
                        {
                            name: '',
                            title: 'none'
                        },
                        {
                            name: 'edit',
                            title: 'edit_keyword'
                        },
                        {
                            name: 'disable',
                            title: 'disable_enable_keyword'
                        },
                        {
                            name: 'extend',
                            title: 'show_keyword_extend_panel'
                        }
                    ]
                },
                {
                    name: 'rightClick',
                    title: 'right_click_keyword_tag',
                    value: '',
                    options: [
                        {
                            name: '',
                            title: 'none'
                        },
                        {
                            name: 'edit',
                            title: 'edit_keyword'
                        },
                        {
                            name: 'disable',
                            title: 'disable_enable_keyword'
                        },
                        {
                            name: 'extend',
                            title: 'show_keyword_extend_panel'
                        }
                    ]
                },
                {
                    name: 'dblClick',
                    title: 'dblclick_keyword_tag',
                    value: '',
                    options: [
                        {
                            name: '',
                            title: 'none'
                        },
                        {
                            name: 'edit',
                            title: 'edit_keyword'
                        },
                        {
                            name: 'disable',
                            title: 'disable_enable_keyword'
                        },
                        {
                            name: 'extend',
                            title: 'show_keyword_extend_panel'
                        }
                    ]
                },
                {
                    name: 'hover',
                    title: 'hover_keyword_tag',
                    value: '',
                    options: [
                        {
                            name: '',
                            title: 'none'
                        },
                        {
                            name: 'extend',
                            title: 'show_keyword_extend_panel'
                        }
                    ]
                }
            ]
        }
    },
    emits: ['update:hotkey'],
    methods: {
        getLang(key) {
            return common.getLang(key);
        },
        open() {
            this.isOpen = true
            this.hotkeys.forEach(item => {
                if (this.defaultHotkey[item.name]) {
                    item.value = this.defaultHotkey[item.name]
                } else {
                    item.value = ''
                }
            })
        },
        close() {
            this.isOpen = false
        },
        onCloseClick() {
            this.close()
        },
        onSaveClick() {
            let data = {}
            this.hotkeys.forEach(item => {
                data[item.name] = item.value
            })
            this.gradioAPI.setData('hotkey', data)
            this.close()
            this.$emit('update:hotkey', data)
        },
    },
}
</script>
