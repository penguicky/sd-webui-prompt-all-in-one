import splitTags from "@/utils/splitTags";
import globals from "../../globals";
import tinycolor from "tinycolor2";

export default {
    loraRegex: /^\<lora:\s*([^\:]+)\s*(:)?\s*(\-?[0-9\.]+)?([^\>]+)?\>/,
    lycoRegex: /^\<lyco:\s*([^\:]+)\s*(:)?\s*(\-?[0-9\.]+)?([^\>]+)?\>$/,
    weightNumRegex: /(.*):(\-?[0-9\.]+)/,
    weightNumRegexEN: /(.*):\s*(\-?[0-9\.]+)/,
    weightNumRegexCN: /(.*)：\s*(\-?[0-9\.]+)/,
    bracketsEN: [
        {'(': '(', ')': ')'},
        {'[': '[', ']': ']'},
        {'{': '{', '}': '}'},
        {'<': '<', '>': '>'},
    ],
    bracketsCN: [
        {'（': '(', '）': ')'},
        {'【': '[', '】': ']'},
        {'《': '<', '》': '>'},
        {'「': '{', '」': '}'},
        {'『': '{', '』': '}'},
        {'〈': '<', '〉': '>'},
        {'﹝': '(', '﹞': ')'},
        {'﹛': '{', '﹜': '}'},
        {'﹙': '(', '﹚': ')'},
    ],

    /**
     * 替换标签
     * @param text {string}
     * @returns {*|string}
     */
    replaceTag(text) {
        if (typeof text !== "string") return text
        if (text === "") return text
        text = this.replaceBrackets(text)
        if (this.weightNumRegexEN.test(text)) text = text.replace(this.weightNumRegexEN, '$1:$2')
        if (this.weightNumRegexCN.test(text)) text = text.replace(this.weightNumRegexCN, '$1:$2')
        return text
    },

    /**
     * 替换括号
     * @param text
     * @returns {*}
     */
    replaceBrackets(text) {
        const length = text.length
        if (length === 0) return text
        let replaces = {}
        this.bracketsCN.forEach(item => {
            for (const key in item) {
                replaces[key] = item[key]
            }
        })

        let start = text[0]
        let end = text[length - 1]
        if (typeof replaces[start] !== "undefined") {
            text = replaces[start] + text.substring(1)
        }
        if (typeof replaces[end] !== "undefined") {
            text = text.substring(0, length - 1) + replaces[end]
        }
        return text
    },

    /**
     * 是否有括号
     * @param text {string}
     * @returns {Array|boolean}
     */
    hasBrackets(text) {
        const length = text.length
        if (length === 0) return false
        let brackets = []
        this.bracketsEN.forEach(item => {
            let temp = []
            for (const key in item) {
                temp.push(key)
            }
            brackets.push(temp)
        })
        this.bracketsCN.forEach(item => {
            let temp = []
            for (const key in item) {
                temp.push(key)
            }
            brackets.push(temp)
        })

        let start = text[0]
        let end = text[length - 1]
        for (const bracket of brackets) {
            if (bracket[0] === start && bracket[1] === end) {
                return bracket
            }
        }
        return false
    },

    /**
     * 拆分标签
     * @param tag {string}
     * @returns {{left: string, right: string, value: string}}
     */
    splitTag(tag) {
        let result = {left: '', value: '', right: ''}
        let match = tag.match(/^([\(\<\{\[]+)(.*)$/)
        if (!match) {
            // 没有匹配到左括号
            result.value = tag
            return result
        }
        result.left = match[1]
        tag = match[2]
        match = tag.match(/((\:[0-9\.]+)?[\)\>\}\]]+)$/)
        if (!match) {
            // 没有匹配到右括号
            result.value = tag
            return result
        }
        result.right = match[1]
        tag = tag.substring(0, tag.length - result.right.length)
        result.value = tag
        return result
    },

    /**
     * 分割标签
     * @param tags {string}
     * @param autoBreakBeforeWrap {boolean}
     * @param autoBreakAfterWrap {boolean}
     * @returns {string[]}
     */
    splitTags(tags, autoBreakBeforeWrap = false, autoBreakAfterWrap = false) {
        return splitTags(tags, autoBreakBeforeWrap, autoBreakAfterWrap)
    },

    /**
     * Get English language string by key
     * @param key {string}
     * @returns {string}
     */
    getLang(key) {
        const val = this._englishStrings[key]
        if (val) {
            return this.replaceGlobals(val)
        }
        return this.replaceGlobals(key)
    },

    replaceGlobals(text) {
        for (let key in globals) {
            let value = globals[key]
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }
        return text
    },

    _englishStrings: {
        "need_api_key": "API Key Required",
        "dont_need_api_key": "API Key Not Required (Unstable)",
        "prompt": "Prompt",
        "negative_prompt": "Negative Prompt",
        "txt2img": "Text to Image",
        "img2img": "Image to Image",
        "please_enter_new_keyword": "Please Enter New Keyword",
        "local_language": "Local Language",
        "increase_weight_add_parentheses": "Increase Keyword Weight: Add ()",
        "increase_weight_subtract_parentheses": "Increase Keyword Weight: Subtract ()",
        "decrease_weight_add_brackets": "Decrease Keyword Weight: Add []",
        "decrease_weight_subtract_brackets": "Decrease Keyword Weight: Subtract []",
        "copy_to_clipboard": "Copy to Clipboard",
        "disable_keyword": "Disable Keyword",
        "enable_keyword": "Enable Keyword",
        "copy_keywords_to_clipboard": "Copy All Keywords to Clipboard",
        "history": "History",
        "clear_history": "Clear History",
        "clear_history_confirm": "Are you sure you want to clear the history?",
        "clear_history_success": "History cleared",
        "max_history_count": "Maximum History Count",
        "favorite": "Favorites",
        "add_to_favorite": "Add to Favorites",
        "remove_from_favorite": "Remove from Favorites",
        "use": "Use",
        "click_to_edit": "Click Left Mouse Button to Edit",
        "drop_to_order": "Hold Down Left Mouse Button to Drag and Sort",
        "enter_to_save": "Press Enter to Save Keyword",
        "enter_to_add": "Press Enter to Add Keyword",

        "unset_name": "Name Not Set",
        "no_history": "No History",
        "get_history_error": "Failed to Get History",
        "no_favorite": "No Favorites",
        "get_favorite_error": "Failed to Get Favorites",
        "hide_default_input_box": "Hide Default Input Box",
        "show_default_input_box": "Show Default Input Box",
        "close": "Close",
        "save": "Save",
        "delete_all_keywords": "Delete All Keywords",
        "delete_all_keywords_confirm": "Are you sure you want to delete all keywords?",
        "whether_to_enable_tooltip": "Enable Tooltips for Each Function. If You Are Familiar with All the Functions of This Extension, You Can Uncheck This Option.",
        "enable_native_highlighting_tooltip": "Enable native textarea syntax highlighting. Shows colored syntax highlighting in WebUI's default prompt input boxes (Blue: Embeddings, Orange: LoRA, Green: Regular terms)",
        "delete_all_history": "Delete All History",
        "delete_all_history_confirm": "Are you sure you want to delete all history?",
        "please_enter_the_content_here": "Please enter content",
        "setting_desc": "Settings: show/hide...",
        "line_break_character": "Line break character",
        "test": "Test",
        "refresh": "Refresh",
        "not_enable": "Not enable",
        "theme_extension": "Theme: Extension Plugin Style",
        "is_remove_space": "Whether to remove the spaces after each comma in the keyword.<br/>Checking will automatically remove the spaces (difficult to read).<br/>Unchecking will keep one space (affecting TOKEN count).",
        "theme": "Theme",
        "enhance": "Enhance",

        "is_remove_last_comma": "Remove the last comma in Prompt or not.<br/>When selected, Prompt output is \"aaa,bbb,ccc\".<br/>When unselected, Prompt output is \"aaa,bbb,ccc,\".",
        "is_keep_weight_zero": "Keep the format of keywords with a weight of 0 or not.<br/>When selected, the keyword format is kept as \"(text:0)\".<br/>When unselected, the format is not kept as \"test\".",
        "is_keep_weight_one": "Keep the format of keywords with a weight of 1 or not.<br/>When selected, the keyword format is kept as \"(text:1)\".<br/>When unselected, the format is not kept as \"test\".",
        "prompt_format": "Prompt Format",
        "dblclick_to_disable": "Double-click to disable/enable keyword",
        "batch_operation": "Batch operation",
        "success": "Success!",
        "failed": "Failed!",
        "packages_desc": "Some packages of python are detected to have not been installed or installed unsuccessfully. You need to click to try reinstalling them. After all the packages are successfully installed, all the functions can work normally.<br/>If you still cannot install them successfully after clicking the install button, you need to manually copy the command and execute it in the terminal.",
        "installed": "Installed",
        "not_install": "Not installed",
        "install": "Install",
        "packages_installing": "Starting to install......If you need to check the detailed installation log, please go to the WebUI console to view it. After the installation is completed, this window will close automatically!",
        "today_not_show": "Do not show this window today",
        "free": "Free",
        "apply_for_free": "Apply for free use",
        "chatgpt_prompts_preset": "StableDiffusion is a deep learning text-to-image model that generates images based on prompts. These prompts can specify the desired elements of the image, such as the appearance of characters, background, color and lighting effects, as well as the theme and style of the image. The prompts often contain weighted numbers in parentheses to indicate the importance or emphasis of certain details. For example, \"(masterpiece:1.5)\" indicates that the quality of the work is very important. Multiple parentheses also have similar effects. In addition, if square brackets are used, such as \"{blue hair:white hair:0.3}\", this represents the fusion of blue and white hair, with blue hair accounting for 0.3.\nHere is an example of using prompts to help an AI model generate an image: masterpiece,(bestquality),highlydetailed,ultra-detailed,cold,solo,(1girl),(detailedeyes),(shinegoldeneyes),(longliverhair),expressionless,(long sleeves),(puffy sleeves),(white wings),shinehalo,(heavymetal:1.2),(metaljewelry),cross-lacedfootwear (chain),(Whitedoves:1.2)\n\nFollowing the example, provide a set of prompts that detail the following content. Start the prompts directly without using natural language to describe them: ",
        "use_chatgpt_gen_prompts": "Use ChatGPT to Generate Prompts",
        "input_image_desc": "Please enter the image description, for example: a cat sitting on top of a building, a very high-definition, very authentic photo.",
        "api_config": "API Configuration",
        "image_desc": "Image Description",
        "preset": "Preset",
        "ai_one": "First Sentence Sent to AI",
        "ai_two": "Second Sentence Sent to AI",
        "restore_to_default": "Restore to System Default",
        "generate": "Generate",
        "generate_result": "Generate Result",
        "is_required": "{0} is required!",
        "is_not_dict": "{0} must be a dictionary!",
        "no_response_from": "No response from {0}!",
        "request_error": "{0} request error!",
        "response_is_empty": "{0} response is empty!",
        "response_error": "{0} response error!",
        "install_success": "{0} installed successfully!",
        "install_failed": "Error: {0} installation failed!",
        "about_desc": "About, Updates, Help, Documentation",
        "version": "Version",
        "unknown_version": "Unknown Version",
        "has_new_version": "There is a new version available, please update",
        "wiki_desc": "Installation tutorial, detailed features, usage instructions, frequently asked questions, etc. See:",
        "switch_to_light_theme": "Switch to Light Theme",
        "switch_to_dark_theme": "Switch to Dark Theme",
        "auto_input_prompt": "Auto-fill prompt when the webpage loads",
        "disabled": "Disabled",
        "last_input_prompt": "Last input prompt",
        "is_break_before_wrap": "Whether to add a line break before the \"BREAK\" keyword.<br/>When selected, a line break will be automatically added.<br/>Deselecting will not perform any action.",
        "is_break_after_wrap": "Whether to add a line break after the \"BREAK\" keyword.<br/>When selected, a line break will be automatically added.<br/>Deselecting will not perform any action.",
        "show_panel": "Show Panel",
        "hide_panel": "Hide Panel",
        "show_group_tags": "Show Group Tags",
        "hide_group_tags": "Hide Group Tags",
        "tags-copyright": "Prompt words integration source from 路过银河(Zhihu)、unknown author(Google Drive)、internet, etc. Thanks to these selfless contributors!",
        "reset_default_color": "Reset to Default Color",
        "clear_color": "Clear Color",
        "tags_color": "Tags Color",
        "keywords_blacklist": "Keywords Blacklist",
        "blacklist_desc": "Keywords set as blacklist will be automatically filtered by the plugin!",
        "prompt_blacklist_list": "Prompt Blacklist List",
        "negative_prompt_blacklist_list": "Negative Prompt Blacklist List",
        "lora_blacklist_list": "Lora Blacklist",
        "lycoris_blacklist_list": "Lycoris Blacklist",
        "embedding_blacklist_list": "Embedding Blacklist",
        "one_keyword_per_line": "One keyword per line",
        "Keyword_group": "Keyword Group",
        "hotkey_setting": "Hotkey Setting",
        "syntax_highlighting_settings": "Syntax Highlighting Settings",
        "color_settings": "Color Settings",
        "embeddings_color": "Embeddings Color",
        "lora_names_color": "LoRA Names Color",
        "regular_terms_color": "Regular Terms Color",
        "weight_boost_color": "Weight Boost Color (>1.0)",
        "weight_reduce_color": "Weight Reduce Color (<1.0)",
        "punctuation_color": "Punctuation Color",
        "category_names_color": "Category Names Color",
        "preview": "Preview",
        "reset_to_defaults": "Reset to Defaults",
        "left_click_keyword_tag": "Left Click Keyword Tag",
        "right_click_keyword_tag": "Right Click Keyword Tag",
        "dblclick_keyword_tag": "Double Click Keyword Tag",
        "hover_keyword_tag": "Hover Keyword Tag",
        "edit_keyword": "Edit Keyword",
        "disable_enable_keyword": "Disable/Enable Keyword",
        "show_keyword_extend_panel": "Show Keyword Extend Panel",
        "none": "None",
        "add_blacklist": "Add to blacklist",
        "confirm_add_blacklist": "Do you want to add the keyword \"{0}\" to the blacklist?",
        "cancel_confirm_add_blacklist": "Cancel the confirmation dialog when adding to the blacklist from the keyword list expansion panel.",
        "model_name": "Model Name",
        "output_name": "Output Name",
        "filename": "File Name",
        "filepath": "File Path",
        "trained_words": "Trigger Keywords",
        "description": "Description",
        "open_civitai": "Open Civitai",
        "use_keywords": "Use Keywords",
        "width": "Width",
        "height": "Height",
        "move_up": "Move Up",
        "move_down": "Move Down",
        "is_remove_lora_before_comma": "Remove the comma before Lora or not.<br/>If selected, the Lora output will be 'aaa &lt;lora:bbb:0.1&gt; &lt;lora:ccc:0.1&gt;, ddd'.<br/>If unselected, the Lora output will be 'aaa, &lt;lora:bbb:0.1&gt;, &lt;lora:ccc:0.1&gt;, ddd'.",
        "is_remove_lora_after_comma": "Remove the comma after Lora or not.<br/>If selected, the Lora output will be 'aaa, &lt;lora:bbb:0.1&gt; &lt;lora:ccc:0.1&gt; ddd'.<br/>If unselected, the Lora output will be 'aaa, &lt;lora:bbb:0.1&gt;, &lt;lora:ccc:0.1&gt;, ddd'.",
        "is_use_novel_ai_weight_symbol": "Whether to use NovelAI's weight symbol.<br/>Checking this will change the weight symbol () to {}",
        "is_remove_before_line_comma": "Whether to remove the comma before a line break.<br/>If checked, the output will be \"aaa, bbb<br/>ccc\".<br/>If unchecked, the output will be \"aaa, bbb,<br/>ccc\".",
        "is_format_category_spacing": "Whether to format category declaration spacing.<br/>When checked, category declarations will be formatted to \"{category: term1, term2, term3}\" format, ensuring one space after colon and one space after commas.",
        "is_remove_category_trailing_comma": "Whether to remove trailing comma in category declarations.<br/>When checked, category declarations like \"{category: term1, term2,}\" will be formatted to \"{category: term1, term2}\".",
        "auto_load_webui_prompt": "Auto-load WebUI prompt changes.<br/>When checked, the plugin will automatically load and format keyword parsing when the content of the prompt input box in WebUI changes.<br/>When unchecked, you need to manually click the load prompt button when the content of the prompt input box in WebUI changes.",
        "load_webui_prompt": "Load WebUI prompt",
        "delete_keyword": "Delete Keyword",
    },

    /**
     * 实体化html
     * @param str {string}
     * @returns {string}
     */
    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, tag => {
            const chars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
            }
            return chars[tag] || tag
        })
    },

    /**
     * 反实体化html
     * @param str {string}
     * @returns {string}
     */
    unescapeHtml(str) {
        return str.replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g, tag => {
            const chars = {
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&#39;': "'",
                '&quot;': '"',
            }
            return chars[tag] || tag
        })
    },

    /**
     * 获取标签的权重数
     * @param tag {string}
     * @returns {number}
     */
    getTagWeightNum(tag) {
        const match = tag.match(this.weightNumRegex)
        let weightNum = match ? parseFloat(match[2]) : 1
        return weightNum
    },

    /**
     * 获取标签的加权数
     * @param tag {string}
     * @param useNovelAiWeightSymbol {boolean}
     * @returns {number}
     */
    getTagIncWeight(tag, useNovelAiWeightSymbol = false) {
        if (useNovelAiWeightSymbol) {
            return this.countLayers(tag, '{', '}')
        } else {
            return this.countLayers(tag, '(', ')')
        }
    },

    /**
     * 获取标签的减权数
     * @param tag {string}
     * @returns {number}
     */
    getTagDecWeight(tag) {
        return this.countLayers(tag, '[', ']')
    },

    /**
     * 计算字符串包裹的层数
     * @param str {string}
     * @param start {string}
     * @param end {string}
     * @returns {number}
     */
    countLayers(str, start = '(', end = ')') {
        let count = 0
        if (str.length < 2) return count // 长度小于2，不可能有会有包裹
        while (true) {
            // 取出第一个和最后一个字符
            let first = str[0]
            let last = str[str.length - 1]
            if (first === start && last === end) {
                // 如果第一个和最后一个字符是括号，且是对应的括号，那么层数加1，然后去掉第一个和最后一个字符
                count++
                // 去掉第一个和最后一个字符
                str = str.slice(1, str.length - 1)
            } else {
                break
            }
        }
        return count
    },

    /**
     * 设置字符串的包裹
     * @param str {string}
     * @param num {number}
     * @param start {string}
     * @param end {string}
     * @param joinStr {string}
     * @returns {string}
     */
    setLayers(str, num = 0, start = '(', end = ')', joinStr = '') {
        // 先去除所有的括号
        while (true) {
            let first = str[0]
            let last = str[str.length - 1]
            if (first === start && last === end) {
                // 如果第一个和最后一个字符是括号，且是对应的括号，那么层数加1，然后去掉第一个和最后一个字符
                // 去掉第一个和最后一个字符
                str = str.slice(1, str.length - 1)
            } else {
                break
            }
        }
        // 如果层数为0，那么直接返回
        if (num === 0) return str
        // 如果层数大于0，那么在字符串的前面加上num个start，后面加上num个end
        return start.repeat(num) + str + joinStr + end.repeat(num)
    },

    /**
     * 判断标签是否相等
     * @param tags1 {Array}
     * @param tags2 {Array}
     * @param ignores {Array}
     * @returns {boolean}
     */
    isEqualTags(tags1, tags2, ignores = []) {
        if (tags2.length !== tags1.length) return false
        for (let i = 0; i < tags1.length; i++) {
            for (let key in tags1[i]) {
                if (ignores.includes(key)) continue
                if (tags2[i][key] !== tags1[i][key]) return false
            }
            for (let key in tags2[i]) {
                if (ignores.includes(key)) continue
                if (tags2[i][key] !== tags1[i][key]) return false
            }
        }
        return true
    },



    /**
     * 隐藏 a1111-sd-webui-tagcomplete 面板
     * @param textarea
     */
    hideCompleteResults(textarea) {
        if (typeof hideResults === 'function') {
            const times = [100, 200, 300, 500, 1000]
            times.forEach(time => {
                setTimeout(() => {
                    hideResults(textarea)
                }, time)
            })
        }
    },

    /**
     * 获取当前时间
     * @param time {number}
     * @returns {string}
     */
    formatTime(time, hasYear = true) {
        let now = new Date(time);
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        if (month < 10) month = "0" + month;
        let day = now.getDate();
        if (day < 10) day = "0" + day;
        let hour = now.getHours();
        if (hour < 10) hour = "0" + hour;
        let minute = now.getMinutes();
        if (minute < 10) minute = "0" + minute;
        let second = now.getSeconds();
        if (second < 10) second = "0" + second;
        if (hasYear) {
            return `${year}/${month}/${day} ${hour}:${minute}:${second}`
        } else {
            return `${month}/${day} ${hour}:${minute}:${second}`
        }
    },

    /**
     * 获取api url
     * @returns {string}
     */
    apiUrl() {
        let url
        url = window.location.origin + window.location.pathname
        url += url.endsWith('/') ? '' : '/'
        url += 'physton_prompt/'
        return url
    },

    /**
     * 移除css
     * @param id {string}
     * @param gradioAPP {boolean}
     */
    removeCSS(id, gradioAPP = true) {
        if (!id) return
        let css = null
        if (gradioAPP) {
            css = this.gradioApp().querySelector("#" + id)
        } else {
            css = document.querySelector("#" + id)
        }
        if (css) {
            css.remove()
        }
    },

    /**
     * 加载css
     * @param file {string}
     * @param id {string}
     * @param remove {boolean}
     * @param cache {boolean}
     * @param gradioAPP {boolean}
     */
    loadCSS(file, id = '', remove = true, cache = false, gradioAPP = true) {
        if (remove) this.removeCSS(id, gradioAPP)
        let url = this.apiUrl() + 'styles?file=' + encodeURIComponent(file)
        if (!cache) {
            url += '&t=' + new Date().getTime()
        }
        let link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = url
        if (gradioAPP) {
            this.gradioApp().appendChild(link)
        } else {
            document.body.appendChild(link)
        }
    },

    /**
     * 插入元素
     * @param newNode {Element}
     * @param referenceNode {Element}
     */
    insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    },

    /**
     * 插入元素
     * @param newNode {Element}
     * @param referenceNode {Element}
     */
    insertAfter(newNode, referenceNode) {
        if (referenceNode.nextSibling) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        } else {
            referenceNode.parentNode.appendChild(newNode);
        }
    },

    gradioContainer: null,
    gradioApp() {
        if (this.gradioContainer) return this.gradioContainer
        const elems = document.getElementsByTagName('gradio-app')
        const gradioShadowRoot = elems.length == 0 ? null : elems[0].shadowRoot
        if (gradioShadowRoot) {
            const gradioContainers = gradioShadowRoot.querySelectorAll(".gradio-container")
            for (let i = 0; i < gradioContainers.length; i++) {
                const gradioContainer = gradioContainers[i]
                if (gradioContainer.querySelectorAll("#tabs").length) {
                    gradioContainer.classList.add("physton-gradio-container")
                    this.gradioContainer = gradioContainer
                    return gradioContainer
                }
            }
        } else {
            document.body.classList.add("physton-gradio-container")
            this.gradioContainer = document.body
            return document.body
        }
    },

    fitterInputColor(color, defaultColor = 'rgba(0,0,0,0)') {
        let cacheKey = 'fitterInputColor:' + color + ':' + defaultColor
        if (localStorage[cacheKey]) return localStorage[cacheKey]

        if (!color || color === '' || color === 'default' || color === 'none' || color === 'null' || color === 'undefined' || color === 'false' || color === 'true') {
            localStorage[cacheKey] = defaultColor
            return defaultColor
        }
        if (!tinycolor(color).isValid()) {
            localStorage[cacheKey] = defaultColor
            return defaultColor
        }
        localStorage[cacheKey] = color
        return color
    },

    isColorTransparent(color) {
        let cacheKey = 'isColorTransparent:' + color
        if (localStorage[cacheKey]) return localStorage[cacheKey] === 'true'
        let result = tinycolor(color).getAlpha() === 0
        localStorage[cacheKey] = result
        return result
    },

    getTagsColorKey(groupName, subGroupName) {
        return groupName + '||' + subGroupName
    },

    getSamePrefixPath(arr)  {
        if (arr.length <= 0) return ''
        const arr1 = arr.map(item => item.split("/"));
        const arr2 = arr1[0];
        const arr3 = arr1.slice(1);
        const result = arr2.filter((item, index) => {
            return arr3.every(item2 => {
                return item2[index] === item;
            });
        });
        return result.join("/");
    }
}