<template>
  <div>
    <template v-for="item in prompts" :key="item.name">
      <physton-prompt
        v-if="item.$textarea"
        :id="item.id"
        :ref="item.id"
        :name="item.name"
        :neg="item.neg"
        :textarea="item.$textarea"
        :steps="item.$steps"
        :history-key="item.historyKey"
        @click:show-history="onShowHistory(item.id, $event)"
        :favorite-key="item.favoriteKey"
        @refresh-favorites="onRefreshFavorites"
        @click:show-favorite="onShowFavorite(item.id, $event)"

        v-model:auto-remove-space="autoRemoveSpace"
        v-model:auto-remove-last-comma="autoRemoveLastComma"
        v-model:auto-keep-weight-zero="autoKeepWeightZero"
        v-model:auto-keep-weight-one="autoKeepWeightOne"
        v-model:auto-break-before-wrap="autoBreakBeforeWrap"
        v-model:auto-break-after-wrap="autoBreakAfterWrap"
        v-model:auto-remove-lora-before-comma="autoRemoveLoraBeforeComma"
        v-model:auto-remove-lora-after-comma="autoRemoveLoraAfterComma"
        v-model:use-novel-ai-weight-symbol="useNovelAiWeightSymbol"
        v-model:auto-remove-before-line-comma="autoRemoveBeforeLineComma"
        v-model:auto-format-category-spacing="autoFormatCategorySpacing"
        v-model:auto-remove-category-trailing-comma="
          autoRemoveCategoryTrailingComma
        "
        :hide-default-input="item.hideDefaultInput"
        @update:hide-default-input="onUpdateHideDefaultInput(item.id, $event)"
        :auto-load-webui-prompt="item.autoLoadWebuiPrompt"
        @update:auto-load-webui-prompt="
          onUpdateAutoLoadWebuiPrompt(item.id, $event)
        "
        :hide-panel="item.hidePanel"
        @update:hide-panel="onUpdateHidePanel(item.id, $event)"
        v-model:enable-tooltip="enableTooltip"
        v-model:enable-native-highlighting="enableNativeHighlighting"

        @click:prompt-format="onPromptFormatClick"
        @click:blacklist="onBlacklistClick"
        @click:hotkey="onHotkeyClick"
        @click:syntax-highlighting-settings="onSyntaxHighlightingSettingsClick"
        @click:select-theme="onSelectThemeClick"

        :extra-networks="extraNetworks"
        :loras="loras"
        :lycos="lycos"
        :embeddings="embeddings"
        :version="version"
        :latest-version="latestVersion"
        :is-latest-version="isLatestVersion"
        @click:show-about="onShowAbout"
        :theme="theme"
        @click:switch-theme="onSwitchTheme"
        :group-tags="groupTags"
        :hide-group-tags="item.hideGroupTags"
        v-model:group-tags-color="groupTagsColor"
        :group-tags-color-key-cache="groupTagsColorKeyCache"
        @update:hide-group-tags="onUpdateHideGroupTags(item.id, $event)"
        v-model:extra-networks-width="extraNetworksWidth"
        v-model:extra-networks-height="extraNetworksHeight"
        :blacklist="blacklist"
        :cancel-blacklist-confirm="cancelBlacklistConfirm"
        @update:blacklist="onUpdateBlacklist"
        :hotkey="hotkey"
        @show-extra-networks="onShowExtraNetworks"
        @hide-extra-networks="onHideExtraNetworks"
        @refresh-extra-networks="onRefreshExtraNetworks"
      ></physton-prompt>
    </template>

    <prompt-format
      ref="promptFormat"
      v-model:auto-remove-space="autoRemoveSpace"
      v-model:auto-remove-last-comma="autoRemoveLastComma"
      v-model:auto-keep-weight-zero="autoKeepWeightZero"
      v-model:auto-keep-weight-one="autoKeepWeightOne"
      v-model:auto-break-before-wrap="autoBreakBeforeWrap"
      v-model:auto-break-after-wrap="autoBreakAfterWrap"
      v-model:auto-remove-lora-before-comma="autoRemoveLoraBeforeComma"
      v-model:auto-remove-lora-after-comma="autoRemoveLoraAfterComma"
      v-model:use-novel-ai-weight-symbol="useNovelAiWeightSymbol"
      v-model:auto-remove-before-line-comma="autoRemoveBeforeLineComma"
      v-model:auto-format-category-spacing="autoFormatCategorySpacing"
      v-model:auto-remove-category-trailing-comma="
        autoRemoveCategoryTrailingComma
      "
    ></prompt-format>
    <blacklist
      ref="blacklist"
      @update:blacklist="onUpdateBlacklist"
    ></blacklist>
    <hotkey
      ref="hotkey"
      :default-hotkey="hotkey"
      @update:hotkey="onUpdateHotkey"
    ></hotkey>
    <history
      ref="history"
      @refresh-favorites="onRefreshFavorites"
      @use="onUseHistory"
    />
    <favorite
      ref="favorite"
      @use="onUseFavorite"
    ></favorite>
    <extension-css
      ref="extensionCss"
    />
    <packages-state
      ref="packagesState"
      :packages-state="packagesState"
      :python="python"
    />

    <about
      ref="about"
    />

    <extra-networks-popup
      ref="extraNetworksPopup"
      :extra-networks="extraNetworks"
    />

    <div
      class="physton-paste-popup"
      v-if="showPastePopup"
      @click="closePastePopup"
    >
      <div class="paste-popup-main" @click.stop>
        <div class="paste-popup-close" @click="closePastePopup">
          <icon-svg name="close" />
        </div>
        <div class="paste-popup-title">{{ pasteTitle }}</div>
        <div class="paste-popup-body">
          <textarea
            class="paste-content"
            v-model="pasteContent"
            :placeholder="getLang('please_enter_the_content_here')"
          ></textarea>
          <div
            v-if="!pasteLoading"
            class="paste-submit"
            @click="onClickPasteSubmit"
          >
            Submit
          </div>
          <div v-else class="paste-submit">
            <icon-svg name="loading" />
          </div>
        </div>
      </div>
    </div>

    <!-- Native textarea highlighting system -->
    <native-highlight-manager
      ref="nativeHighlighter"
      :enabled="enableNativeHighlighting"
      :embeddings="embeddings"
      :loras="loras"
      :lycos="lycos"
    />

    <!-- Syntax Highlighting Settings Panel -->
    <syntax-highlighting-settings
      ref="syntaxHighlightingSettings"
      :colors="syntaxHighlightingColors"
      @update:colors="onUpdateSyntaxHighlightingColors"
    />
  </div>
</template>

<script>
import PhystonPrompt from "./components/phystonPrompt.vue";

import common from "@/utils/common";

import Favorite from "@/components/favorite.vue";
import History from "@/components/history.vue";
import IconSvg from "@/components/iconSvg.vue";
import ExtensionCss from "@/components/extensionCss.vue";
import PromptFormat from "@/components/promptFormat.vue";
import Blacklist from "@/components/blacklist.vue";
import PackagesState from "@/components/packagesState.vue";

import About from "@/components/about.vue";
import globals from "../globals";
import jsYaml from "js-yaml";
import { ref } from "vue";
import Hotkey from "@/components/hotkey.vue";
import ExtraNetworksPopup from "@/components/extraNetworksPopup.vue";
import NativeHighlightManager from "@/components/nativeHighlightManager.vue";
import SyntaxHighlightingSettings from "@/components/syntaxHighlightingSettings.vue";
import waitTick from "@/utils/waitTick";

export default {
  name: "App",
  components: {
    Hotkey,
    About,

    PackagesState,
    PromptFormat,
    Blacklist,
    ExtensionCss,
    IconSvg,
    History,
    Favorite,

    PhystonPrompt,
    ExtraNetworksPopup,
    NativeHighlightManager,
    SyntaxHighlightingSettings,
  },
  data() {
    return {
      prompts: [
        {
          tab: "tab_txt2img",
          prompt: "txt2img_prompt",
          counter: "txt2img_token_counter",
          button: "txt2img_token_button",
          steps: "txt2img_steps",
          historyKey: "txt2img",
          favoriteKey: "txt2img",
          $prompt: null,
          $textarea: null,
          $steps: null,
          name: "txt2img_prompt",
          neg: false,
          hideDefaultInputKey: "txt2ImgHideDefaultInput",
          hideDefaultInput: false,
          autoLoadWebuiPromptKey: "txt2ImgAutoLoadWebuiPrompt",
          autoLoadWebuiPrompt: true,
          hidePanelKey: "txt2ImgHidePanel",
          hidePanel: false,
          hideGroupTagsKey: "txt2ImgHideGroupTags",
          hideGroupTags: false,
          id: "phystonPrompt_txt2img_prompt",
        },
        {
          tab: "tab_txt2img",
          prompt: "txt2img_neg_prompt",
          counter: "txt2img_negative_token_counter",
          button: "txt2img_negative_token_button",
          steps: "txt2img_steps",
          historyKey: "txt2img_neg",
          favoriteKey: "txt2img_neg",
          $prompt: null,
          $textarea: null,
          $steps: null,
          name: "txt2img_neg_prompt",
          neg: true,
          hideDefaultInputKey: "txt2ImgNegHideDefaultInput",
          hideDefaultInput: false,
          autoLoadWebuiPromptKey: "txt2ImgNegAutoLoadWebuiPrompt",
          autoLoadWebuiPrompt: true,
          hidePanelKey: "txt2ImgNegHidePanel",
          hidePanel: false,
          hideGroupTagsKey: "txt2ImgNegHideGroupTags",
          hideGroupTags: false,
          id: "phystonPrompt_txt2img_neg_prompt",
        },
        {
          tab: "tab_img2img",
          prompt: "img2img_prompt",
          counter: "img2img_token_counter",
          button: "img2img_token_button",
          steps: "img2img_steps",
          historyKey: "img2img",
          favoriteKey: "img2img",
          $prompt: null,
          $textarea: null,
          $steps: null,
          name: "img2img_prompt",
          neg: false,
          hideDefaultInputKey: "img2ImgHideDefaultInput",
          hideDefaultInput: false,
          autoLoadWebuiPromptKey: "img2ImgAutoLoadWebuiPrompt",
          autoLoadWebuiPrompt: true,
          hidePanelKey: "img2ImgHidePanel",
          hidePanel: false,
          hideGroupTagsKey: "img2ImgHideGroupTags",
          hideGroupTags: false,
          id: "phystonPrompt_img2img_prompt",
        },
        {
          tab: "tab_img2img",
          prompt: "img2img_neg_prompt",
          counter: "img2img_negative_token_counter",
          button: "img2img_negative_token_button",
          steps: "img2img_steps",
          historyKey: "img2img_neg",
          favoriteKey: "img2img_neg",
          $prompt: null,
          $textarea: null,
          $steps: null,
          name: "img2img_neg_prompt",
          neg: true,
          hideDefaultInputKey: "img2ImgNegHideDefaultInput",
          hideDefaultInput: false,
          autoLoadWebuiPromptKey: "img2ImgNegAutoLoadWebuiPrompt",
          autoLoadWebuiPrompt: true,
          hidePanelKey: "img2ImgNegHidePanel",
          hidePanel: false,
          hideGroupTagsKey: "img2ImgNegHideGroupTags",
          hideGroupTags: false,
          id: "phystonPrompt_img2img_neg_prompt",
        },
      ],
      autoRemoveSpace: true,
      autoRemoveLastComma: false,
      autoKeepWeightZero: false,
      autoKeepWeightOne: false,
      autoBreakBeforeWrap: false,
      autoBreakAfterWrap: false,
      autoRemoveLoraBeforeComma: false,
      autoRemoveLoraAfterComma: false,
      useNovelAiWeightSymbol: false,
      autoRemoveBeforeLineComma: false,
      autoFormatCategorySpacing: true,
      autoRemoveCategoryTrailingComma: true,
      // hideDefaultInput: false,
      enableTooltip: true,
      enableNativeHighlighting: true,

      startWatchSave: false,

      pasteBtn: null,
      showPastePopup: false,
      pasteTitle: "",
      pasteContent: "",
      pasteLoading: false,

      historyCurrentPrompt: "",
      favoriteCurrentPrompt: "",


      extraNetworks: [],
      loras: [],
      lycos: [],
      embeddings: [],

      python: "",
      packagesState: [],

      version: "",
      latestVersion: "",
      isLatestVersion: true,

      theme: "dark",

      groupTags: [],
      groupTagsColor: {},
      groupTagsColorKeyCache: {},
      extraNetworksWidth: 100,
      extraNetworksHeight: 120,

      blacklist: {},
      cancelBlacklistConfirm: false,

      hotkey: {
        click: "edit", // edit, disable, extend
        dblClick: "disable", // edit, disable, extend
        rightClick: "", // edit, disable, extend
        hover: "extend", // extend
      },

      // Syntax highlighting color settings
      syntaxHighlightingColors: {
        embeddings: "#0066cc",
        loraNames: "#ff6600",
        regularTerms: "#00cc66",
        weightValueBoost: "#00cc66", // > 1.0
        weightValueReduce: "#cc0066", // < 1.0
        punctuation: "#9966cc", // For weights, LoRA syntax, and categories
        categoryNames: "#ff69b4",
      },
    };
  },
  watch: {
    // Debounced watchers for extraNetworks dimensions (need timer references)
    extraNetworksWidth() {
      if (!this.startWatchSave) return;
      if (this.extraNetworksWidthTimer)
        clearTimeout(this.extraNetworksWidthTimer);
      this.extraNetworksWidthTimer = setTimeout(() => {
        this.gradioAPI
          .setData("extraNetworksWidth", this.extraNetworksWidth)
          .then((data) => {})
          .catch((err) => {});
      }, 500);
    },
    extraNetworksHeight() {
      if (!this.startWatchSave) return;
      if (this.extraNetworksHeightTimer)
        clearTimeout(this.extraNetworksHeightTimer);
      this.extraNetworksHeightTimer = setTimeout(() => {
        this.gradioAPI
          .setData("extraNetworksHeight", this.extraNetworksHeight)
          .then((data) => {})
          .catch((err) => {});
      }, 500);
    },
  },
  created() {
    // Data-driven setting watchers — replaces 17 near-identical watcher blocks
    const saveAndUpdatePrompt = [
      'autoRemoveSpace', 'autoRemoveLastComma', 'autoBreakBeforeWrap',
      'autoBreakAfterWrap', 'autoFormatCategorySpacing', 'autoRemoveCategoryTrailingComma',
    ];
    const saveOnly = [
      'autoKeepWeightZero', 'autoKeepWeightOne', 'autoRemoveLoraBeforeComma',
      'autoRemoveLoraAfterComma', 'useNovelAiWeightSymbol', 'autoRemoveBeforeLineComma',
      'enableNativeHighlighting',
    ];
    const deepSaveOnly = ['groupTagsColor', 'syntaxHighlightingColors'];

    // Settings that save + trigger updatePrompt on all prompts
    saveAndUpdatePrompt.forEach((prop) => {
      this.$watch(prop, (val) => {
        if (!this.startWatchSave) return;
        this.gradioAPI.setData(prop, val).then(() => {
          this.prompts.forEach((item) => {
            this.$refs[item.id][0].updatePrompt();
          });
        }).catch(() => {});
      });
    });

    // Settings that only save (no side effects)
    saveOnly.forEach((prop) => {
      this.$watch(prop, (val) => {
        if (!this.startWatchSave) return;
        this.gradioAPI.setData(prop, val).catch(() => {});
      });
    });

    // Deep watchers that only save
    deepSaveOnly.forEach((prop) => {
      this.$watch(prop, (val) => {
        if (!this.startWatchSave) return;
        this.gradioAPI.setData(prop, val).catch(() => {});
      }, { deep: true });
    });

    // Special: enableTooltip — save + localStorage + updateTippyState
    this.$watch('enableTooltip', (val) => {
      if (!this.startWatchSave) return;
      localStorage.setItem('phystonPromptEnableTooltip', val ? 'true' : 'false');
      this.updateTippyState();
      this.gradioAPI.setData('enableTooltip', val).catch(() => {});
    });
  },
  mounted() {
    common.loadCSS(
      "toastr.min.css",
      "physton-prompt-toastr",
      true,
      true,
      false
    );
    common.loadCSS("tippy.css", "physton-prompt-tippy", true, true, false);
    common.loadCSS(
      "vue3-colorpicker.css",
      "physton-prompt-vue3-colorpicker",
      true,
      true,
      false
    );
    common.loadCSS(
      "animate.min.css",
      "physton-prompt-animate",
      true,
      true,
      false
    );
    common.loadCSS("main.min.css", "physton-prompt-main", true);

    const urlParams = new URLSearchParams(window.location.search);
    let theme = urlParams.get("__theme");
    if (["dark", "light"].includes(theme)) {
      this.theme = theme;
      if (!common.gradioApp().classList.contains(this.theme)) {
        common.gradioApp().classList.add(this.theme);
      }
    }

    // sd-webui-lobe-theme
    setTimeout(() => {
      let hasLobeTheme = false;
      let hasKitchenTheme = false;
      if (
        localStorage.getItem("SD-LOBE-SETTING") ||
        localStorage.getItem("SD-KITCHEN-SETTING") ||
        document
          .querySelector('head > meta[name="application-name"]')
          ?.content?.includes?.("Lobe")
      ) {
        let links = document.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
          let link = links[i];
          if (link.href.includes("lobehub/")) {
            hasLobeTheme = true;
            break;
          } else if (link.href.includes("kitchen-theme")) {
            hasKitchenTheme = true;
          }
        }
      }
      if (hasLobeTheme) {
        common.gradioApp().classList.add("physton-prompt-lobehub");
      } else if (hasKitchenTheme) {
        common.gradioApp().classList.add("physton-prompt-kitchen");
      }
    }, 3000);

    this.gradioAPI
      .getConfig()
      .then((res) => {
        this.python = res.python;
        this.packagesState = res.packages_state;
        this.init();
      })
      .catch((err) => {
        this.$toastr.error(
          "Connection to backend API service failed. Please manually refresh the webpage. If it still doesn't work, please restart the WebUI.<br/>连接到后台接口服务失败，请手动再刷新一次网页。如果还是不行，请重启WebUI。<br/><br/>" +
            err.message,
          globals.shortName,
          { timeOut: 20000 }
        );
      });
  },
  beforeUnmount() {
    // Clean up paste polling timers to prevent memory leaks
    if (this._pastePollingTimeout) {
      clearTimeout(this._pastePollingTimeout);
      this._pastePollingTimeout = null;
    }
    if (this._pastePollingInterval) {
      clearInterval(this._pastePollingInterval);
      this._pastePollingInterval = null;
    }
    // Clean up debounced extraNetworks timers
    if (this.extraNetworksWidthTimer) {
      clearTimeout(this.extraNetworksWidthTimer);
      this.extraNetworksWidthTimer = null;
    }
    if (this.extraNetworksHeightTimer) {
      clearTimeout(this.extraNetworksHeightTimer);
      this.extraNetworksHeightTimer = null;
    }
  },
  methods: {
    getLang(key) {
      return common.getLang(key);
    },
    init() {
      this.loadExtraNetworks();
      let dataListsKeys = [
        "autoRemoveSpace",
        "autoRemoveLastComma",
        "autoKeepWeightZero",
        "autoKeepWeightOne",
        "autoBreakBeforeWrap",
        "autoBreakAfterWrap",
        "autoRemoveLoraBeforeComma",
        "autoRemoveLoraAfterComma",
        "useNovelAiWeightSymbol",
        "autoRemoveBeforeLineComma",
        "autoFormatCategorySpacing",
        "autoRemoveCategoryTrailingComma",
        "enableTooltip",
        "enableNativeHighlighting",
        "extensionSelect.minimalist",
        "groupTagsColor",
        "blacklist",
        "cancelBlacklistConfirm",
        "hotkey",
        "extraNetworksWidth",
        "extraNetworksHeight",
        "syntaxHighlightingColors",
      ];
      this.prompts.forEach((item) => {
        dataListsKeys.push(item.hideDefaultInputKey);
        dataListsKeys.push(item.autoLoadWebuiPromptKey);
        dataListsKeys.push(item.hidePanelKey);
        dataListsKeys.push(item.hideGroupTagsKey);
      });

      this.gradioAPI.getDatas(dataListsKeys).then((data) => {
        if (data.autoRemoveSpace !== null) {
          this.autoRemoveSpace = data.autoRemoveSpace;
        }
        if (data.autoRemoveLastComma !== null) {
          this.autoRemoveLastComma = data.autoRemoveLastComma;
        }
        if (data.autoKeepWeightZero !== null) {
          this.autoKeepWeightZero = data.autoKeepWeightZero;
        }
        if (data.autoKeepWeightOne !== null) {
          this.autoKeepWeightOne = data.autoKeepWeightOne;
        }
        if (data.autoBreakBeforeWrap !== null) {
          this.autoBreakBeforeWrap = data.autoBreakBeforeWrap;
        }
        if (data.autoBreakAfterWrap !== null) {
          this.autoBreakAfterWrap = data.autoBreakAfterWrap;
        }
        if (data.autoRemoveLoraBeforeComma !== null) {
          this.autoRemoveLoraBeforeComma = data.autoRemoveLoraBeforeComma;
        }
        if (data.autoRemoveLoraAfterComma !== null) {
          this.autoRemoveLoraAfterComma = data.autoRemoveLoraAfterComma;
        }
        if (data.useNovelAiWeightSymbol !== null) {
          this.useNovelAiWeightSymbol = data.useNovelAiWeightSymbol;
        }
        if (data.autoRemoveBeforeLineComma !== null) {
          this.autoRemoveBeforeLineComma = data.autoRemoveBeforeLineComma;
        }
        if (data.autoFormatCategorySpacing !== null) {
          this.autoFormatCategorySpacing = data.autoFormatCategorySpacing;
        }
        if (data.autoRemoveCategoryTrailingComma !== null) {
          this.autoRemoveCategoryTrailingComma =
            data.autoRemoveCategoryTrailingComma;
        }
        if (data.enableTooltip !== null) {
          this.enableTooltip = data.enableTooltip;
        }
        if (data.enableNativeHighlighting !== null) {
          this.enableNativeHighlighting = data.enableNativeHighlighting;
        }
        localStorage.setItem(
          "phystonPromptEnableTooltip",
          this.enableTooltip ? "true" : "false"
        );
        this.updateTippyState();

        if (data["extensionSelect.minimalist"] === null) {
          this.gradioAPI.setData("extensionSelect.minimalist", true);
        }

        if (data.groupTagsColor !== null) {
          if (typeof data.groupTagsColor === "object") {
            this.groupTagsColor = {};
            for (let key in data.groupTagsColor) {
              let color = data.groupTagsColor[key];
              this.groupTagsColor[key] = ref(common.fitterInputColor(color));
            }
          }
        }

        if (data.blacklist !== null) {
          this.blacklist = this._handleBlacklist(data.blacklist);
        }

        if (data.cancelBlacklistConfirm !== null) {
          this.cancelBlacklistConfirm = data.cancelBlacklistConfirm;
        }

        if (data.hotkey !== null) {
          this.hotkey = data.hotkey;
        }

        if (data.extraNetworksWidth !== null) {
          this.extraNetworksWidth = data.extraNetworksWidth;
        }

        if (data.extraNetworksHeight !== null) {
          this.extraNetworksHeight = data.extraNetworksHeight;
        }

        // Load syntax highlighting colors from storage
        if (data.syntaxHighlightingColors !== null) {
          this.syntaxHighlightingColors = { ...data.syntaxHighlightingColors };
        }

        // Translation functionality removed
        this.$refs.extensionCss.init();

        // Apply syntax highlighting colors on startup
        this.applySyntaxHighlightingColors();

        // Ensure colors are applied after a short delay for any late-loading components
        setTimeout(() => {
          this.applySyntaxHighlightingColors();
        }, 1000);

        this.prompts.forEach((item) => {
          if (data[item.hideDefaultInputKey] !== null) {
            item.hideDefaultInput = data[item.hideDefaultInputKey];
          }
          if (data[item.autoLoadWebuiPromptKey] !== null) {
            item.autoLoadWebuiPrompt = data[item.autoLoadWebuiPromptKey];
          }
          if (data[item.hidePanelKey] !== null) {
            item.hidePanel = data[item.hidePanelKey];
          }
          if (data[item.hideGroupTagsKey] !== null) {
            item.hideGroupTags = data[item.hideGroupTagsKey];
          }
          item.$prompt = common.gradioApp().querySelector("#" + item.prompt);
          item.$textarea = item.$prompt.getElementsByTagName("textarea")[0];
          item.$steps = common.gradioApp().querySelector("#" + item.steps);
        });
        this.$nextTick(() => {
          this.prompts.forEach((item) => {
            const $prompt = common.gradioApp().querySelector("#" + item.id);
            item.$prompt.parentElement.parentElement.after($prompt);
            item.$prompt.parentElement.parentElement.style.display =
              item.hideDefaultInput ? "none" : "flex";
            // item.$textarea.parentNode.appendChild($prompt)
          });

          this.startWatchSave = true;
        });

        this.handlePaste();

        waitTick.addWaitTick(() => this.loadGroupTags());


      });
    },
    loadGroupTags() {
      return this.gradioAPI.getGroupTags('en_US').then((data) => {
        if (!data || data === "") {
          this.groupTags = [];
        } else {
          try {
            this.groupTags = jsYaml.load(data);
            if (!Array.isArray(this.groupTags)) {
              this.groupTags = [];
            }
          } catch (e) {
            this.groupTags = [];
          }
        }
        this._handleGroupTags();
      });
    },
    _handleGroupTags() {
      this.groupTags.forEach((item, index) => {
        item.type = item.type || "";
        item.tabKey = "groupTags-" + index;
        item.groups.forEach((group, subIndex) => {
          group.type = group.type || "";
          group.tabKey = "subGroupTags-" + index + "-" + subIndex;
          if (group.type == "wrap") return;
          let key = common.getTagsColorKey(item.name, group.name);
          if (!this.groupTagsColor[key]) {
            this.groupTagsColor[key] = ref(
              common.fitterInputColor(group.color)
            );
          }
          for (let en in group.tags) {
            if (!en) continue;
            this.groupTagsColorKeyCache[en] = key;
          }
        });
      });
    },
    updateTippyState() {
      for (const $tippy of this.$tippyList) {
        if (this.enableTooltip) {
          $tippy.enable();
        } else {
          $tippy.disable();
        }
      }
    },

    onPromptFormatClick(e) {
      this.$refs.promptFormat.open(e);
    },
    onBlacklistClick(e) {
      this.$refs.blacklist.open(e);
    },
    onHotkeyClick(e) {
      this.$refs.hotkey.open(e);
    },
    onSyntaxHighlightingSettingsClick(e) {
      this.$refs.syntaxHighlightingSettings.open();
    },
    onSelectThemeClick() {
      this.$refs.extensionCss.open();
    },
    handlePaste() {
      if (typeof gradioApp !== "function") return;
      const $pastes = gradioApp().querySelectorAll("#paste");
      if (!$pastes || $pastes.length <= 0) return;
      $pastes.forEach(($paste, index) => {
        // 拷贝一个新的按钮
        const $pasteNew = $paste.cloneNode(true);
        $pasteNew.id = "paste-new-" + index;
        $pasteNew.innerHTML = "🗒";
        // 加到原来的按钮后面一个
        $paste.parentNode.insertBefore($pasteNew, $paste.nextSibling);
        // 原来的按钮隐藏
        // $paste.style.display = 'none'
        // 监听新按钮点击事件
        $pasteNew.addEventListener("click", () => {
          this.pasteBtn = $paste;
          this.openPastePopup();
        });
        this.pasteTitle = $paste.title;
      });
    },
    openPastePopup() {
      this.pasteContent = "";
      this.pasteLoading = false;
      this.showPastePopup = true;
    },
    closePastePopup() {
      this.showPastePopup = false;
    },
    onClickPasteSubmit() {
      this.pasteLoading = true;
      const ele = get_uiCurrentTabContent();
      let $textarea = null;
      let $textareaNeg = null;
      let $prompt = null;
      let $promptNeg = null;
      let ids = [];
      for (const item of this.prompts) {
        if (item.tab == ele.id) {
          ids.push(item.id);
          if (item.neg) {
            $textareaNeg = item.$textarea;
            $promptNeg = item.$prompt;
          } else {
            $textarea = item.$textarea;
            $prompt = item.$prompt;
          }
        }
      }
      if (!$textarea || !$prompt || !$promptNeg) {
        this.pasteLoading = false;
        return;
      }
      $textarea.value = this.pasteContent;
      $textarea.dispatchEvent(new Event("input"));
      this.pasteBtn.dispatchEvent(new Event("click"));

      // Store timeout/interval IDs for cleanup on unmount
      this._pastePollingTimeout = setTimeout(() => {
        this._pastePollingTimeout = null;
        let intervalI = 0;
        this._pastePollingInterval = setInterval(() => {
          intervalI++;
          if (intervalI > 100) {
            this.pasteLoading = false;
            clearInterval(this._pastePollingInterval);
            this._pastePollingInterval = null;
            return;
          }
          if (
            $prompt.getElementsByClassName("hide").length > 0 &&
            $promptNeg.getElementsByClassName("hide").length > 0
          ) {
            this.pasteLoading = false;
            this.closePastePopup();
            clearInterval(this._pastePollingInterval);
            this._pastePollingInterval = null;
            common.hideCompleteResults($textarea);
            common.hideCompleteResults($textareaNeg);
            ids.forEach((id, index) => {
              setTimeout(() => {
                this.$refs[id][0].onTextareaChange(true);
              }, 1000);
            });
          }
        }, 100);
      }, 1000);
    },
    onUpdateHideDefaultInput(id, value) {
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      item.hideDefaultInput = value;
      this.gradioAPI.setData(item.hideDefaultInputKey, item.hideDefaultInput);
      item.$prompt.parentElement.parentElement.style.display =
        item.hideDefaultInput ? "none" : "flex";
    },
    onUpdateAutoLoadWebuiPrompt(id, value) {
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      item.autoLoadWebuiPrompt = value;
      this.gradioAPI.setData(
        item.autoLoadWebuiPromptKey,
        item.autoLoadWebuiPrompt
      );
    },
    onUpdateHidePanel(id, value) {
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      item.hidePanel = value;
      this.gradioAPI.setData(item.hidePanelKey, item.hidePanel);
    },
    onUpdateHideGroupTags(id, value) {
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      item.hideGroupTags = value;
      this.gradioAPI.setData(item.hideGroupTagsKey, item.hideGroupTags);
    },
    onShowHistory(id, e) {
      this.$refs.favorite.hide();
      this.historyCurrentPrompt = id;
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      this.$refs.history.show(item.historyKey, e);
    },
    onUseHistory(history) {
      if (!this.historyCurrentPrompt) return;
      const item = this.prompts.find(
        (item) => item.id == this.historyCurrentPrompt
      );
      if (!item) return;
      this.$refs[item.id][0].useFavorite(history);
    },
    onShowFavorite(id, e) {
      this.$refs.history.hide();
      this.favoriteCurrentPrompt = id;
      const item = this.prompts.find((item) => item.id == id);
      if (!item) return;
      this.$refs.favorite.show(item.favoriteKey, e);
    },
    onUseFavorite(favorite) {
      if (!this.favoriteCurrentPrompt) return;
      const item = this.prompts.find(
        (item) => item.id == this.favoriteCurrentPrompt
      );
      if (!item) return;
      this.$refs[item.id][0].useFavorite(favorite);
    },
    onRefreshFavorites(key) {
      this.$refs.favorite.getFavorites(key);
    },

    onUpdateSyntaxHighlightingColors(colors) {
      this.syntaxHighlightingColors = { ...colors };

      // Apply colors immediately without waiting for persistence
      this.applySyntaxHighlightingColors();

      // Save to storage (async, doesn't block UI updates)
      this.gradioAPI.setData(
        "syntaxHighlightingColors",
        this.syntaxHighlightingColors
      );
    },
    applySyntaxHighlightingColors() {
      // Apply colors to CSS custom properties for real-time updates
      const root = document.documentElement;

      // Set all CSS custom properties with high priority
      root.style.setProperty(
        "--syntax-highlight-embeddings",
        this.syntaxHighlightingColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-lora-names",
        this.syntaxHighlightingColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-regular-terms",
        this.syntaxHighlightingColors.regularTerms,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-weight-boost",
        this.syntaxHighlightingColors.weightValueBoost,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-weight-reduce",
        this.syntaxHighlightingColors.weightValueReduce,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-punctuation",
        this.syntaxHighlightingColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-category-names",
        this.syntaxHighlightingColors.categoryNames,
        "important"
      );

      // ADDITIONAL: Set intermediate CSS custom properties directly
      // This ensures the extension tag system gets the colors immediately
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueLoraTag-color",
        this.syntaxHighlightingColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueLycoTag-color",
        this.syntaxHighlightingColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueEmbeddingTag-color",
        this.syntaxHighlightingColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueRegularTag-color",
        this.syntaxHighlightingColors.regularTerms,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightPunctuation-color",
        this.syntaxHighlightingColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightValueBoost-color",
        this.syntaxHighlightingColors.weightValueBoost,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightValueReduce-color",
        this.syntaxHighlightingColors.weightValueReduce,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-loraPunctuation-color",
        this.syntaxHighlightingColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-categoryName-color",
        this.syntaxHighlightingColors.categoryNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-embeddingContent-color",
        this.syntaxHighlightingColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-loraContent-color",
        this.syntaxHighlightingColors.loraNames,
        "important"
      );

      // Single immediate update
      this.forceImmediateColorUpdates();

      // One asynchronous update for DOM-dependent operations
      this.$nextTick(() => {
        // Only refresh native highlighting, tags are already updated
        if (this.$refs.nativeHighlighter) {
          this.$refs.nativeHighlighter.refreshHighlighting();
        }
      });
    },

    forceImmediateColorUpdates() {
      // 1. Trigger re-highlighting in native highlighter
      if (this.$refs.nativeHighlighter) {
        this.$refs.nativeHighlighter.refreshHighlighting();
      }

      // 2. Trigger SAFE re-rendering of all prompt tags
      this.prompts.forEach((item) => {
        if (this.$refs[item.id] && this.$refs[item.id][0]) {
          const promptComponent = this.$refs[item.id][0];

          // Use the safe refreshTags method
          if (promptComponent.refreshTags) {
            promptComponent.refreshTags();
          }

          // Also force a Vue update on the prompt component
          promptComponent.$forceUpdate();
        }
      });

      // 3. Force a gentle style recalculation
      document.body.offsetHeight; // Single reflow is sufficient

      // 4. Additional step: Force re-render of any visible tag elements with direct color application
      this.$nextTick(() => {
        const tagElements = document.querySelectorAll(".prompt-tag-value");

        tagElements.forEach((el) => {
          // Apply colors directly to elements as a fallback
          if (el.classList.contains("embedding-tag")) {
            el.style.setProperty(
              "color",
              this.syntaxHighlightingColors.embeddings,
              "important"
            );
          } else if (
            el.classList.contains("lora-tag") ||
            el.classList.contains("lyco-tag")
          ) {
            el.style.setProperty(
              "color",
              this.syntaxHighlightingColors.loraNames,
              "important"
            );
          } else if (el.classList.contains("regular-tag")) {
            el.style.setProperty(
              "color",
              this.syntaxHighlightingColors.regularTerms,
              "important"
            );
          }

          // Force style recalculation on each tag
          el.offsetHeight;
        });
      });
    },

    onShowAbout() {
      this.$refs.about.open();
    },
    onSwitchTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      let currentUrl = window.location.href;
      let url = new URL(currentUrl);
      let params = new URLSearchParams(url.search);
      if (params.has("__theme")) {
        params.set("__theme", this.theme);
      } else {
        params.append("__theme", this.theme);
      }
      let newUrl = url.origin + url.pathname + "?" + params.toString();
      window.location.href = newUrl;
    },
    _handleBlacklist(blacklist) {
      blacklist = { ...blacklist };
      blacklist.prompt = blacklist.prompt
        ?.slice()
        .map((item) => item.toLowerCase());
      blacklist.negative_prompt = blacklist.negative_prompt
        ?.slice()
        .map((item) => item.toLowerCase());
      blacklist.lora = blacklist.lora
        ?.slice()
        .map((item) => item.toLowerCase());
      blacklist.lycoris = blacklist.lycoris
        ?.slice()
        .map((item) => item.toLowerCase());
      blacklist.embedding = blacklist.embedding
        ?.slice()
        .map((item) => item.toLowerCase());
      return blacklist;
    },
    onUpdateBlacklist(data, cancelBlacklistConfirm) {
      this.blacklist = this._handleBlacklist(data);
      if (typeof cancelBlacklistConfirm === "boolean")
        this.cancelBlacklistConfirm = cancelBlacklistConfirm;
    },
    onUpdateHotkey(data) {
      this.hotkey = data;
    },
    onShowExtraNetworks(e, name, useCallback, showCheckpoints, from) {
      this.$refs.extraNetworksPopup.show(
        e,
        name,
        useCallback,
        showCheckpoints,
        from
      );
    },
    onHideExtraNetworks() {
      this.$refs.extraNetworksPopup.hide();
    },
    onRefreshExtraNetworks() {
      this._loadExtraNetworks();
    },
  },
};
</script>
