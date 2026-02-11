<template>
    <Transition name="fadeDown">
        <div class="physton-prompt-blacklist" v-if="isOpen" @click="onCloseClick">
            <div class="blacklist-main" @click.stop>
                <div class="blacklist-popup-close" @click="onCloseClick">
                    <icon-svg name="close"/>
                </div>
                <div class="blacklist-body" @click.stop>
                    <div class="blacklist-desc">1. {{ getLang('blacklist_desc') }}</div>
                    <div class="blacklist-group">
                        <div class="group-title">{{ getLang('prompt_blacklist_list') }}:</div>
                        <textarea class="group-content" :placeholder="getLang('one_keyword_per_line')" v-model="textarea.prompt"></textarea>
                    </div>
                    <div class="blacklist-group">
                        <div class="group-title">{{ getLang('negative_prompt_blacklist_list') }}:</div>
                        <textarea class="group-content" :placeholder="getLang('one_keyword_per_line')" v-model="textarea.negative_prompt"></textarea>
                    </div>
                    <div class="blacklist-wrap"></div>
                    <div class="blacklist-group">
                        <div class="group-title">{{ getLang('lora_blacklist_list') }}:</div>
                        <textarea class="group-content" :placeholder="getLang('one_keyword_per_line')" v-model="textarea.lora"></textarea>
                    </div>
                    <div class="blacklist-group">
                        <div class="group-title">{{ getLang('lycoris_blacklist_list') }}:</div>
                        <textarea class="group-content" :placeholder="getLang('one_keyword_per_line')" v-model="textarea.lycoris"></textarea>
                    </div>
                    <div class="blacklist-group">
                        <div class="group-title">{{ getLang('embedding_blacklist_list') }}:</div>
                        <textarea class="group-content" :placeholder="getLang('one_keyword_per_line')" v-model="textarea.embedding"></textarea>
                    </div>
                    <div class="blacklist-wrap"></div>
                    <div class="blacklist-group">
                        <div class="group-title">
                            <label>
                                <input type="checkbox" v-model="cancelBlacklistConfirm">
                                {{ getLang('cancel_confirm_add_blacklist') }}
                            </label>
                        </div>
                    </div>
                    <div class="blacklist-wrap"></div>
                    <div class="setting-btns">
                        <div class="blacklist-save hover-scale-120" @click="onSaveClick">{{ getLang('save') }}</div>
                        <div class="blacklist-close hover-scale-120" @click="onCloseClick">{{ getLang('close') }}</div>
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
    name: 'Blacklist',
    components: {IconSvg},
    props: {
    },
    data() {
        return {
            isOpen: false,
            data: {
                prompt: [],
                negative_prompt: [],
                lora: [],
                lycoris: [],
                embedding: [],
            },
            cancelBlacklistConfirm: false,
            textarea: {
                prompt: '',
                negative_prompt: '',
                lora: '',
                lycoris: '',
                embedding: '',
            },
        }
    },
    emits: ['update:blacklist'],
    methods: {
        getLang(key) {
            return common.getLang(key);
        },
        open() {
            this.isOpen = true
            this.data = {
                prompt: [],
                negative_prompt: [],
                lora: [],
                lycoris: [],
                embedding: [],
            }
            this.textarea = {
                prompt: '',
                negative_prompt: '',
                lora: '',
                lycoris: '',
                embedding: '',
            }
            const keys = ['prompt', 'negative_prompt', 'lora', 'lycoris', 'embedding']
            this.gradioAPI.getDatas(['blacklist', 'cancelBlacklistConfirm']).then(res => {
                if (res.blacklist) {
                    keys.forEach(k => { this.data[k] = res.blacklist[k] || [] })
                }
                if (res.cancelBlacklistConfirm) {
                    this.cancelBlacklistConfirm = res.cancelBlacklistConfirm
                }
                keys.forEach(k => { this.textarea[k] = this.data[k].join('\n') })
            })
        },
        close() {
            this.isOpen = false
        },
        onCloseClick() {
            this.close()
        },
        onSaveClick() {
            const keys = ['prompt', 'negative_prompt', 'lora', 'lycoris', 'embedding']
            keys.forEach(k => {
                this.data[k] = this.textarea[k].split(/\s*\n\s*/).filter(item => item?.trim().length)
            })
            this.gradioAPI.setData('blacklist', this.data)
            this.gradioAPI.setData('cancelBlacklistConfirm', this.cancelBlacklistConfirm)
            this.close()
            this.$emit('update:blacklist', this.data, this.cancelBlacklistConfirm)
        },
    },
}
</script>
