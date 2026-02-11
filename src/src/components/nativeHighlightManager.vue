<template>
  <div class="native-highlight-manager">
    <!-- Highlighter instances for each target textarea -->
    <textarea-highlighter
      v-for="target in activeTargets"
      :key="target.id"
      :target-selector="target.selector"
      :embedding-exists="embeddingExists"
      :lora-exists="loraExists"
      :lyco-exists="lycoExists"
      ref="highlighters"
    />
  </div>
</template>

<script>
import TextareaHighlighter from "./textareaHighlighter.vue";
import common from "@/utils/common";

export default {
  name: "NativeHighlightManager",
  components: {
    TextareaHighlighter,
  },
  props: {
    enabled: {
      type: Boolean,
      default: true,
    },
    embeddings: {
      type: Object,
      default: () => ({}),
    },
    loras: {
      type: Object,
      default: () => ({}),
    },
    lycos: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      activeTargets: [],
      checkInterval: null,
      isInitialized: false,
    };
  },
  computed: {
    targetSelectors() {
      return [
        "#txt2img_prompt textarea",
        "#img2img_prompt textarea",
        "#txt2img_neg_prompt textarea",
        "#img2img_neg_prompt textarea",
      ];
    },
  },
  watch: {
    enabled(newVal) {
      if (newVal) {
        this.startHighlighting();
      } else {
        this.stopHighlighting();
      }
    },
    embeddings: {
      handler() {
        // Refresh highlighting when embeddings data changes
        this.refreshHighlighting();
      },
      deep: true,
    },
    loras: {
      handler() {
        // Refresh highlighting when loras data changes
        this.refreshHighlighting();
      },
      deep: true,
    },
    lycos: {
      handler() {
        // Refresh highlighting when lycos data changes
        this.refreshHighlighting();
      },
      deep: true,
    },
  },
  mounted() {
    if (this.enabled) {
      this.startHighlighting();
    }
  },
  beforeUnmount() {
    this.stopHighlighting();
  },
  methods: {
    startHighlighting() {
      if (this.isInitialized) return;

      this.isInitialized = true;
      this.findAndActivateTargets();

      // Periodically check for new textareas (in case they're dynamically created)
      this.checkInterval = setInterval(() => {
        this.findAndActivateTargets();
      }, 2000);
    },

    stopHighlighting() {
      this.isInitialized = false;
      this.activeTargets = [];

      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    },

    findAndActivateTargets() {
      try {
        const gradioApp = common.gradioApp();
        if (!gradioApp) return;

        const newTargets = [];

        this.targetSelectors.forEach((selector, index) => {
          try {
            const element = gradioApp.querySelector(selector);
            if (element && element.tagName === "TEXTAREA") {
              const targetId = `target-${index}-${selector.replace(
                /[^a-zA-Z0-9]/g,
                "-"
              )}`;

              // Check if we already have this target
              const existingTarget = this.activeTargets.find(
                (t) => t.id === targetId
              );
              if (!existingTarget) {
                newTargets.push({
                  id: targetId,
                  selector: selector,
                  element: element,
                });
              } else {
                // Keep existing target
                newTargets.push(existingTarget);
              }
            }
          } catch (error) {
            console.warn(`Failed to process selector ${selector}:`, error);
          }
        });

        // Update active targets only if there are changes
        if (
          newTargets.length !== this.activeTargets.length ||
          !newTargets.every((target) =>
            this.activeTargets.some((existing) => existing.id === target.id)
          )
        ) {
          this.activeTargets = newTargets;
        }
      } catch (error) {
        console.warn("Failed to find and activate targets:", error);
      }
    },

    refreshHighlighting() {
      // SAFE refresh of all highlighters for color changes
      // Single immediate refresh
      this.forceRefreshAllHighlighters();

      // One asynchronous refresh for DOM-dependent operations
      this.$nextTick(() => {
        this.forceRefreshAllHighlighters();
      });
    },

    forceRefreshAllHighlighters() {
      if (this.$refs.highlighters) {
        this.$refs.highlighters.forEach((highlighter) => {
          if (highlighter) {
            // Use the safe forceRefresh method
            if (highlighter.forceRefresh) {
              highlighter.forceRefresh();
            }
            // Fallback to updateHighlighting if forceRefresh not available
            else if (highlighter.updateHighlighting) {
              highlighter.updateHighlighting();
            }
          }
        });
      }

      // Gentle style recalculation
      document.body.offsetHeight;
    },

    // Validation methods that use the extension's existing logic
    embeddingExists(name) {
      // Use the same logic as commonMixin.js
      if (typeof this.embeddings !== "object") return false;
      return this.embeddings[name.toLowerCase()] ?? false;
    },

    loraExists(name) {
      // Use the same logic as commonMixin.js
      if (typeof this.loras !== "object") return false;
      return this.loras[name.toLowerCase()] ?? false;
    },

    lycoExists(name) {
      // Use the same logic as commonMixin.js
      if (typeof this.lycos !== "object") return false;
      return this.lycos[name.toLowerCase()] ?? false;
    },

    // Public methods for external control
    enable() {
      this.enabled = true;
    },

    disable() {
      this.enabled = false;
    },

    toggle() {
      this.enabled = !this.enabled;
    },
  },
};
</script>

<style scoped>
.native-highlight-manager {
  position: relative;
  pointer-events: none;
  z-index: 0;
}
</style>
