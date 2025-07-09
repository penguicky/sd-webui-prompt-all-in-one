<template>
  <Transition name="fadeDown">
    <div
      class="physton-syntax-highlighting-settings"
      v-if="isOpen"
      @click="onCloseClick"
    >
      <div class="settings-main" @click.stop>
        <div class="settings-close" @click="onCloseClick">
          <icon-svg name="close" />
        </div>
        <div class="settings-content" @click.stop>
          <div class="settings-header">
            <h2>
              {{
                getLang("syntax_highlighting_settings") ||
                "Syntax Highlighting Settings"
              }}
            </h2>
          </div>

          <!-- Color Settings Section -->
          <div class="settings-section">
            <h3>{{ getLang("color_settings") || "Color Settings" }}</h3>

            <div class="color-setting-group">
              <div class="color-setting-item">
                <label>{{ getLang("embeddings_color") || "Embeddings" }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.embeddings"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.embeddings"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#0066cc"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{ getLang("lora_names_color") || "LoRA Names" }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.loraNames"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.loraNames"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#ff6600"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{
                  getLang("regular_terms_color") || "Regular Terms"
                }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.regularTerms"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.regularTerms"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#00cc66"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{
                  getLang("weight_boost_color") || "Weight Values > 1.0"
                }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.weightValueBoost"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.weightValueBoost"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#00cc66"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{
                  getLang("weight_reduce_color") || "Weight Values < 1.0"
                }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.weightValueReduce"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.weightValueReduce"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#cc0066"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{
                  getLang("punctuation_color") || "Punctuation (Weights & LoRA)"
                }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.punctuation"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.punctuation"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#9966cc"
                  />
                </div>
              </div>

              <div class="color-setting-item">
                <label>{{
                  getLang("category_names_color") || "Category Names"
                }}</label>
                <div class="color-input-wrapper">
                  <input
                    type="color"
                    v-model="localColors.categoryNames"
                    @input="onColorChange"
                    class="color-picker"
                  />
                  <input
                    type="text"
                    v-model="localColors.categoryNames"
                    @input="onColorChange"
                    class="color-text"
                    placeholder="#ff69b4"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="settings-section">
            <h3>{{ getLang("preview") || "Preview" }}</h3>
            <div class="preview-container">
              <div class="preview-text" v-html="previewHtml"></div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="settings-actions">
            <button @click="onResetClick" class="btn-reset">
              {{ getLang("reset_to_defaults") || "Reset to Defaults" }}
            </button>
            <button @click="onSaveClick" class="btn-save">
              {{ getLang("save") || "Save" }}
            </button>
            <button @click="onCloseClick" class="btn-cancel">
              {{ getLang("cancel") || "Cancel" }}
            </button>
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
  name: "SyntaxHighlightingSettings",
  components: {
    IconSvg,
  },
  props: {
    colors: {
      type: Object,
      required: true,
    },
    languageCode: {
      type: String,
      default: "en",
    },
    languages: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:colors", "close"],
  data() {
    return {
      isOpen: false,
      localColors: {},
      defaultColors: {
        embeddings: "#0066cc",
        loraNames: "#ff6600",
        regularTerms: "#00cc66",
        weightValueBoost: "#00cc66",
        weightValueReduce: "#cc0066",
        weightValueNormal: "#00cc66",
        punctuation: "#9966cc",
        categoryNames: "#ff69b4",
      },
    };
  },
  computed: {
    previewHtml() {
      return this.generatePreviewHtml();
    },
  },
  watch: {
    colors: {
      handler(newColors) {
        this.localColors = { ...newColors };
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    getLang(key) {
      return common.getLang(key, this.languageCode, this.languages);
    },

    open() {
      this.isOpen = true;
      this.localColors = { ...this.colors };
      // Apply current colors immediately when opening
      this.$nextTick(() => {
        this.applyColorsToCSS();
      });
    },

    onCloseClick() {
      this.isOpen = false;
      this.$emit("close");
    },

    onColorChange() {
      // PRODUCTION-SAFE DEBUG: Always log color changes
      console.log(
        "🎨 SETTINGS: Color changed, applying updates...",
        this.localColors
      );

      // Apply colors in real-time for immediate preview and live updates
      this.applyColorsToCSS();

      // Emit the color changes immediately to parent for real-time application
      this.$emit("update:colors", { ...this.localColors });
      console.log("🎨 SETTINGS: Emitted color update to parent");

      // Force immediate visual update of the preview
      this.$forceUpdate();
    },

    onResetClick() {
      this.localColors = { ...this.defaultColors };
      this.applyColorsToCSS();

      // Emit the reset colors immediately
      this.$emit("update:colors", { ...this.localColors });

      // Force immediate visual update
      this.$forceUpdate();
    },

    onSaveClick() {
      this.$emit("update:colors", { ...this.localColors });
      this.isOpen = false;
    },

    applyColorsToCSS() {
      // Apply colors to CSS custom properties for real-time preview
      const root = document.documentElement;
      root.style.setProperty(
        "--syntax-highlight-embeddings",
        this.localColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-lora-names",
        this.localColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-regular-terms",
        this.localColors.regularTerms,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-weight-boost",
        this.localColors.weightValueBoost,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-weight-reduce",
        this.localColors.weightValueReduce,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-punctuation",
        this.localColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--syntax-highlight-category-names",
        this.localColors.categoryNames,
        "important"
      );

      // ADDITIONAL: Set intermediate CSS custom properties directly for immediate effect
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueLoraTag-color",
        this.localColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueLycoTag-color",
        this.localColors.loraNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueEmbeddingTag-color",
        this.localColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-promptTagValueRegularTag-color",
        this.localColors.regularTerms,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightPunctuation-color",
        this.localColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightValueBoost-color",
        this.localColors.weightValueBoost,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-weightValueReduce-color",
        this.localColors.weightValueReduce,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-loraPunctuation-color",
        this.localColors.punctuation,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-categoryName-color",
        this.localColors.categoryNames,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-embeddingContent-color",
        this.localColors.embeddings,
        "important"
      );
      root.style.setProperty(
        "--pp-pt-dsb-ptl-pt-ptm-pte-ptv-loraContent-color",
        this.localColors.loraNames,
        "important"
      );

      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.log("Settings panel applied colors to CSS:", this.localColors);
      }

      // Force a style recalculation to ensure immediate visual updates
      this.$nextTick(() => {
        document.body.offsetHeight; // Trigger reflow
      });
    },

    generatePreviewHtml() {
      const styles = {
        embeddings: `color: ${this.localColors.embeddings}; font-weight: 500;`,
        loraNames: `color: ${this.localColors.loraNames}; font-weight: 500;`,
        regularTerms: `color: ${this.localColors.regularTerms};`,
        weightBoost: `color: ${this.localColors.weightValueBoost}; font-weight: 500;`,
        weightReduce: `color: ${this.localColors.weightValueReduce}; font-weight: 500;`,
        punctuation: `color: ${this.localColors.punctuation};`,
        categoryNames: `color: ${this.localColors.categoryNames}; font-weight: 500;`,
      };

      return `
        <div style="font-family: monospace; line-height: 1.5; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <span style="${styles.regularTerms}">beautiful</span> <span style="${styles.regularTerms}">woman</span><span style="${styles.punctuation}">,</span> 
          <span style="${styles.punctuation}">(</span><span style="${styles.embeddings}">masterpiece</span><span style="${styles.punctuation}">:</span><span style="${styles.weightBoost}">1.2</span><span style="${styles.punctuation}">)</span><span style="${styles.punctuation}">,</span> 
          <span style="${styles.punctuation}">[</span><span style="${styles.regularTerms}">blurry</span><span style="${styles.punctuation}">:</span><span style="${styles.weightReduce}">0.8</span><span style="${styles.punctuation}">]</span><span style="${styles.punctuation}">,</span><br/>
          <span style="${styles.punctuation}">&lt;</span><span style="${styles.punctuation}">lora</span><span style="${styles.punctuation}">:</span><span style="${styles.loraNames}">realistic_vision</span><span style="${styles.punctuation}">:</span><span style="${styles.weightBoost}">1.1</span><span style="${styles.punctuation}">&gt;</span><span style="${styles.punctuation}">,</span> 
          <span style="${styles.embeddings}">bad_hands</span><span style="${styles.punctuation}">,</span><br/>
          <span style="${styles.punctuation}">{</span><span style="${styles.categoryNames}">style</span><span style="${styles.punctuation}">:</span> <span style="${styles.regularTerms}">photorealistic</span><span style="${styles.punctuation}">,</span> <span style="${styles.embeddings}">detailed_face</span><span style="${styles.punctuation}">}</span>
        </div>
      `;
    },
  },
};
</script>

<style scoped>
.physton-syntax-highlighting-settings {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.settings-main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.settings-close {
  position: absolute;
  top: 15px;
  right: 15px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.settings-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.settings-content {
  padding: 20px;
}

.settings-header h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

.color-setting-group {
  display: grid;
  gap: 15px;
}

.color-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
}

.color-setting-item label {
  font-weight: 500;
  color: #333;
  min-width: 180px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  width: 80px;
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.preview-container {
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  padding: 15px;
}

.preview-text {
  font-size: 14px;
}

.settings-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.settings-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-reset {
  background: #6c757d;
  color: white;
}

.btn-reset:hover {
  background: #5a6268;
}

.btn-save {
  background: #007bff;
  color: white;
}

.btn-save:hover {
  background: #0056b3;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

/* Dark theme support */
.physton-gradio-container.dark .settings-main {
  background: #2d2d2d;
  color: #fff;
}

.physton-gradio-container.dark .settings-header h2,
.physton-gradio-container.dark .settings-section h3 {
  color: #fff;
}

.physton-gradio-container.dark .color-setting-item {
  background: #3d3d3d;
  border-color: #555;
}

.physton-gradio-container.dark .color-setting-item label {
  color: #fff;
}

.physton-gradio-container.dark .color-text {
  background: #3d3d3d;
  border-color: #555;
  color: #fff;
}

.physton-gradio-container.dark .preview-container {
  background: #3d3d3d;
  border-color: #555;
}

/* Transition animations */
.fadeDown-enter-active,
.fadeDown-leave-active {
  transition: all 0.3s ease;
}

.fadeDown-enter-from,
.fadeDown-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
