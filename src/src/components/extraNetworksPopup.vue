<template>
    <div class="physton-prompt-extra-networks-popup" ref="extraNetworks"
         :data-from="from"
         @mouseenter.stop="onMouseEnter"
         @mousemove.stop="onMouseMove"
         @mouseleave.stop="onMouseLeave"
         v-show="isShow"
         :style="style">
        <div class="popup-main">
            <img class="info-preview" v-if="data.preview" :src="data.preview" :style="previewStyle" @load="onPreviewLoad"/>
            <div class="info-raws">
                <div class="info-raw">
                    <div class="raw-name">{{ getLang('model_name') }}</div>
                    <div class="raw-value" @click="copy(data.name)">{{ data.name }}</div>
                </div>
                <div class="info-raw" v-if="data.output_name">
                    <div class="raw-name">{{ getLang('output_name') }}</div>
                    <div class="raw-value" @click="copy(data.output_name)">{{ data.output_name }}</div>
                </div>
                <div class="info-raw" v-if="data.basename">
                    <div class="raw-name">{{ getLang('filename') }}</div>
                    <div class="raw-value" @click="copy(data.basename)">{{ data.basename }}</div>
                </div>
                <div class="info-raw" v-if="data.dirname">
                    <div class="raw-name">{{ getLang('filepath') }}</div>
                    <div class="raw-value" @click="copy(data.dirname)">{{ data.dirname }}</div>
                </div>
                <div class="info-raw" v-if="data.trainedWords && data.trainedWords.length">
                    <div class="raw-name">{{ getLang('trained_words') }}</div>
                    <div class="raw-value">
                        <div class="raw-words" v-for="(value) in data.trainedWords" :key="value" @click="onUseKeywordsClick(value)">{{ value }}</div>
                    </div>
                </div>
                <div class="info-raw" v-if="data.description">
                    <div class="raw-name">{{ getLang('description') }}</div>
                    <div class="raw-value" v-tooltip="data.description" @click="copy(data.description)"><div class="raw-description">{{ data.description }}</div></div>
                </div>
                <div class="info-raw" v-if="data.civitaiUrl">
                    <div class="raw-name">Civitai</div>
                    <div class="raw-value"><a :href="data.civitaiUrl" target="_blank" class="raw-link">{{ data.civitaiUrl }}</a></div>
                </div>
                <!--<div class="info-btns">
                    <div class="info-btn hover-scale-120" v-if="data.modelId" @click="onOpenCivitaiClick">{{ getLang('open_civitai') }}</div>
                    <div class="info-btn hover-scale-120" v-if="data.trainedWords && data.trainedWords.length" @click="onUseKeywordsClick">{{ getLang('use_keywords') }}</div>
                </div>-->
            </div>
        </div>
    </div>
</template>
<script>
import IconSvg from "@/components/iconSvg.vue";
import common from "@/utils/common";
import globals from "../../globals";

const TYPE_LORA = 'lora'
const TYPE_LYCO = 'lyco'
const TYPE_EMBEDDING = 'embedding'
export default {
    name: 'ExtraNetworksPopup',
    components: {IconSvg},
    mixins: [],
    props: {
        extraNetworks: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            isShow: false,
            e: null,
            name: '',
            useCallback: null,
            type: '',
            from: 'tags',
            data: {},
            style: {},
            previewStyle: {},
            mouseIn: false,
            eMouseIn: false,
        }
    },
    computed: {},
    watch: {
        extraNetworks: {
            handler(networks) {
                // Build a lookup Map for O(1) name → item resolution.
                // Replaces nested for-loops in show() that scanned every item on every hover.
                const map = new Map()
                if (!networks) return (this._networkLookup = map)
                for (const network of networks) {
                    let type
                    if (network.name === 'textual inversion') type = TYPE_EMBEDDING
                    else if (network.name === 'lora') type = TYPE_LORA
                    else if (network.name === 'lycoris') type = TYPE_LYCO
                    else if (network.name === 'checkpoints') type = 'checkpoints'
                    else continue

                    for (const item of network.items) {
                        const entry = { type, item }
                        const nameLower = item.name.toLowerCase()
                        if (!map.has(nameLower)) map.set(nameLower, entry)
                        if (item.output_name) {
                            const outLower = item.output_name.toLowerCase()
                            if (!map.has(outLower)) map.set(outLower, entry)
                        }
                    }
                }
                this._networkLookup = map
            },
            immediate: true,
        },
    },
    mounted() {
    },
    methods: {
        getLang(key) {
            return common.getLang(key);
        },
        show(e, name, useCallback, showCheckpoints = false, from = 'tags') {
            this.mouseIn = false
            this.eMouseIn = true
            this.e = e
            this.name = name
            this.useCallback = useCallback
            this.type = ''
            this.from = from
            this.data = {}
            this.style = {}
            this.previewStyle = {}
            let data
            name = name.toLowerCase()

            // O(1) lookup via pre-built Map (replaces nested for-loops)
            const entry = this._networkLookup && this._networkLookup.get(name)
            if (entry) {
                // Skip checkpoints unless explicitly requested
                if (entry.type === 'checkpoints' && !showCheckpoints) {
                    // fall through to not-found
                } else {
                    this.type = entry.type
                    data = entry.item
                }
            }

            if (!this.type) return this.isShow = false
            this.isShow = true

            this.data.name = data.civitai_info && data.civitai_info.model && data.civitai_info.model.name ? data.civitai_info.model.name : data.name
            this.data.output_name = data.output_name && data.output_name !== this.data.name ? data.output_name : ''
            this.data.basename = data.basename || ''
            this.data.dirname = data.dirname || ''
            this.data.description = data.civitai_info && data.civitai_info.description ? data.civitai_info.description : (data.description || '')
            this.data.description = this.data.description.replace(/<[^>]+>/g, '')
            this.data.trainedWords = data.civitai_info && data.civitai_info.trainedWords ? data.civitai_info.trainedWords : []
            this.data.preview = data.preview || (data.civitai_info && data.civitai_info.images && data.civitai_info.images.length ? data.civitai_info.images[0] : '')
            this.data.modelId = data.civitai_info && data.civitai_info.modelId ? data.civitai_info.modelId : ''
            this.data.civitaiUrl = this.data.modelId ? this.getCivitaiUrl(this.data.modelId) : ''
            this.$nextTick(() => {
                const eRect = e.getBoundingClientRect()
                this.style.top = (eRect.top + e.offsetHeight + 4) + 'px'
                this.style.left = eRect.left + 'px'
                if (this.data.preview) {
                    this.previewStyle = {
                        width: 'auto',
                        height: this.$refs.extraNetworks.offsetHeight + 'px',
                    }
                }
                this.$nextTick(() => {
                    this.onPreviewLoad()
                })
            })
        },
        onPreviewLoad() {
            const rect = this.$refs.extraNetworks.getBoundingClientRect()
            if (rect.right > window.innerWidth) {
                this.style.left = (window.innerWidth - rect.width - 10) + 'px'
            }
        },
        _hide() {
            if (!this.isShow) return
            if (this.hideTimer) clearTimeout(this.hideTimer)
            this.hideTimer = setTimeout(() => {
                this.hideTimer = null
                if (!this.mouseIn && !this.eMouseIn) {
                    this.isShow = false
                }
            }, 10)
        },
        hide() {
            this.eMouseIn = false
            this._hide()
        },
        onMouseEnter() {
            this.mouseIn = true
        },
        onMouseMove() {
            this.mouseIn = true
        },
        onMouseLeave() {
            this.mouseIn = false
            this._hide()
        },
        copy(text) {
            this.$copyText(text).then(() => {
                this.$toastr.success(this.getLang('success'))
            }).catch(() => {
                this.$toastr.error(this.getLang('failed'))
            })
        },
        getCivitaiUrl(modelId) {
            return globals.civitaiUrl + '/models/' + modelId
        },
        onOpenCivitaiClick() {
            if (!this.data.modelId) return
            let url = this.getCivitaiUrl(this.data.modelId)
            window.open(url)
        },
        /*onUseKeywordsClick() {
            if (!this.data.trainedWords || !this.data.trainedWords.length) return
            if (!this.useCallback) return
            if (typeof this.useCallback !== 'function') return
            this.useCallback(this.data.trainedWords)
            this.$toastr.success(this.getLang('success'))
        },*/
        onUseKeywordsClick(value) {
            if (!value) return
            if (typeof this.useCallback !== 'function') return
            let tags = common.splitTags(value)
            console.log(tags)
            this.useCallback(tags)
            // this.$toastr.success(this.getLang('success'))
        },
    },
}
</script>