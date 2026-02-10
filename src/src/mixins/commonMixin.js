import common from "@/utils/common";
import GradioAPI from "@/utils/gradioAPI";

export default {
    data() {
        return {
            /**
             * @type {GradioAPI}
             */
            gradioAPI: null,
        }
    },
    beforeMount() {
        this.gradioAPI = new GradioAPI()
    },
    methods: {
        loadExtraNetworks(loadI = 0) {
            if (common.gradioApp().querySelectorAll("#txt2img_checkpoints_cards .card").length) {
                // console.log('系统ExtraNetworks已加载，开始加载ExtraNetworks')
                return this._loadExtraNetworks()
            }
            if (loadI > 10) {
                // console.log('超时10秒，开始加载ExtraNetworks')
                return this._loadExtraNetworks()
            }
            setTimeout(this.loadExtraNetworks, 1000, loadI + 1)
        },
        _loadExtraNetworks() {
            this.gradioAPI.getExtraNetworks().then(res => {
                if (!res) return
                this.extraNetworks = res

                // Build a single lookup Map for O(1) name resolution.
                // Used by getExtraNetworkFullName() instead of nested for-loops.
                const fullNameMap = new Map()

                res.forEach(extraNetwork => {
                    if (extraNetwork.name === 'textual inversion') {
                        let list = {}
                        extraNetwork.items.forEach(item => {
                            list[item.name.toLowerCase()] = item.name
                        })
                        this.embeddings = list
                    } else if (extraNetwork.name === 'lora' || extraNetwork.name === 'lycoris') {
                        let list = {}
                        extraNetwork.items.forEach(item => {
                            const nameLower = item.name.toLowerCase()
                            list[nameLower] = item.name
                            // Also index into fullNameMap for getExtraNetworkFullName
                            const key = extraNetwork.name + ':' + nameLower
                            if (!fullNameMap.has(key)) fullNameMap.set(key, item)
                            if (item.output_name) {
                                const outLower = item.output_name.toLowerCase()
                                list[outLower] = item.name
                                const outKey = extraNetwork.name + ':' + outLower
                                if (!fullNameMap.has(outKey)) fullNameMap.set(outKey, item)
                            }
                        })
                        if (extraNetwork.name === 'lora') {
                            this.loras = list
                        } else {
                            this.lycos = list
                        }
                    }
                })
                this._extraNetworkFullNameMap = fullNameMap
            })
        },
        getExtraNetworkFullName(name, type = 'lora') {
            if (!this._extraNetworkFullNameMap) return name
            const item = this._extraNetworkFullNameMap.get(type + ':' + name.toLowerCase())
            if (!item) return name
            if (!item.civitai_info?.name) return name
            if (item.civitai_info.model?.name && item.civitai_info.model.name !== item.civitai_info.name) {
                return '[' + item.civitai_info.name + '] ' + item.civitai_info.model.name
            }
            return item.civitai_info.name
        },
        loraExists(name) {
            if (typeof this.loras !== 'object') return name
            return this.loras[name.toLowerCase()] ?? false
        },
        lycoExists(name) {
            if (typeof this.lycos !== 'object') return name
            return this.lycos[name.toLowerCase()] ?? false
        },
        embeddingExists(name) {
            if (typeof this.embeddings !== 'object') return name
            return this.embeddings[name.toLowerCase()] ?? false
        },
    }
}
