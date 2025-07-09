<template>
  <div class="syntax-highlighter-wrapper" ref="highlighterWrapper">
    <!-- Syntax highlighted background -->
    <pre
      ref="highlightLayer"
      class="highlight-background"
      aria-hidden="true"
    ><code v-html="highlightedContent"></code></pre>
  </div>
</template>

<script>
import common from "@/utils/common";

export default {
  name: "TextareaHighlighter",
  props: {
    targetSelector: {
      type: String,
      required: true,
    },
    embeddingExists: {
      type: Function,
      required: true,
    },
    loraExists: {
      type: Function,
      required: true,
    },
    lycoExists: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      targetTextarea: null,
      highlightedContent: "",
      isActive: false,
      debounceTimer: null,
      resizeTimer: null,
    };
  },
  mounted() {
    this.initializeHighlighter();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    initializeHighlighter() {
      // Find the target textarea
      this.findTargetTextarea();

      if (this.targetTextarea) {
        this.setupHighlighting();
        this.setupObservers();
      } else {
        // Retry finding textarea after a delay
        setTimeout(() => {
          this.initializeHighlighter();
        }, 1000);
      }
    },

    findTargetTextarea() {
      const gradioApp = common.gradioApp();
      if (gradioApp) {
        this.targetTextarea = gradioApp.querySelector(this.targetSelector);
      }
    },

    setupHighlighting() {
      if (!this.targetTextarea) return;

      // Insert the highlighter wrapper right before the textarea
      const textareaParent = this.targetTextarea.parentElement;
      textareaParent.insertBefore(
        this.$refs.highlighterWrapper,
        this.targetTextarea
      );

      // Apply the CSS Grid overlay technique
      this.applyOverlayStyles();

      // Set up event listeners
      this.targetTextarea.addEventListener("input", this.onTextareaInput);
      this.targetTextarea.addEventListener("scroll", this.onTextareaScroll);

      // Add window resize listener to maintain alignment
      window.addEventListener("resize", this.onWindowResize);

      // Initial highlighting
      this.updateHighlighting();

      this.isActive = true;
    },

    applyOverlayStyles() {
      if (!this.targetTextarea || !this.$refs.highlighterWrapper) return;

      const textareaStyle = window.getComputedStyle(this.targetTextarea);
      const wrapper = this.$refs.highlighterWrapper;
      const highlightLayer = this.$refs.highlightLayer;
      const codeElement = highlightLayer.querySelector("code");

      // Create a CSS Grid container that overlays both elements
      const textareaParent = this.targetTextarea.parentElement;
      textareaParent.style.display = "grid";
      textareaParent.style.position = "relative";

      // Both elements occupy the same grid cell
      wrapper.style.gridArea = "1 / 1 / 2 / 2";
      this.targetTextarea.style.gridArea = "1 / 1 / 2 / 2";

      // Ensure exact positioning and sizing
      wrapper.style.position = "relative";
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      wrapper.style.overflow = "hidden";

      // Copy critical font and spacing properties with exact precision
      const criticalStyles = {
        fontFamily: textareaStyle.fontFamily,
        fontSize: textareaStyle.fontSize,
        fontWeight: textareaStyle.fontWeight,
        fontStyle: textareaStyle.fontStyle,
        fontVariant: textareaStyle.fontVariant,
        lineHeight: textareaStyle.lineHeight,
        letterSpacing: textareaStyle.letterSpacing,
        wordSpacing: textareaStyle.wordSpacing,
        textAlign: textareaStyle.textAlign,
        textIndent: textareaStyle.textIndent,
        textTransform: textareaStyle.textTransform,
        whiteSpace: textareaStyle.whiteSpace,
        wordWrap: textareaStyle.wordWrap,
        overflowWrap: textareaStyle.overflowWrap,
        tabSize: textareaStyle.tabSize,
        padding: textareaStyle.padding,
        paddingTop: textareaStyle.paddingTop,
        paddingRight: textareaStyle.paddingRight,
        paddingBottom: textareaStyle.paddingBottom,
        paddingLeft: textareaStyle.paddingLeft,
        border: textareaStyle.border,
        borderWidth: textareaStyle.borderWidth,
        borderStyle: textareaStyle.borderStyle,
        borderColor: "transparent",
        borderRadius: textareaStyle.borderRadius,
        boxSizing: textareaStyle.boxSizing,
        margin: "0", // Reset margin to prevent offset
        width: "100%",
        height: "100%",
      };

      // Apply styles to wrapper
      Object.assign(wrapper.style, criticalStyles);

      // Apply styles to pre element
      Object.assign(highlightLayer.style, {
        ...criticalStyles,
        margin: "0",
        background: "transparent",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
      });

      // Apply styles to code element for perfect alignment
      if (codeElement) {
        Object.assign(codeElement.style, {
          fontFamily: textareaStyle.fontFamily,
          fontSize: textareaStyle.fontSize,
          fontWeight: textareaStyle.fontWeight,
          lineHeight: textareaStyle.lineHeight,
          letterSpacing: textareaStyle.letterSpacing,
          wordSpacing: textareaStyle.wordSpacing,
          margin: "0",
          padding: "0",
          border: "none",
          background: "transparent",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          display: "block",
        });
      }

      // Make textarea transparent but keep caret visible
      this.targetTextarea.style.background = "transparent";
      this.targetTextarea.style.color = "transparent";
      this.targetTextarea.style.caretColor = "#ffffff";
      this.targetTextarea.style.zIndex = "2";
      this.targetTextarea.style.resize = "none";
      this.targetTextarea.style.outline = "none";

      // Don't remove the border completely - make it transparent instead
      this.targetTextarea.style.borderColor = "transparent";

      // Style the highlight layer for proper layering
      wrapper.style.zIndex = "1";
      wrapper.style.pointerEvents = "none";

      // Verify alignment after styles are applied
      this.$nextTick(() => {
        this.verifyAlignment();
      });
    },

    verifyAlignment() {
      if (!this.targetTextarea || !this.$refs.highlightLayer) return;

      const textareaRect = this.targetTextarea.getBoundingClientRect();
      const highlightRect = this.$refs.highlightLayer.getBoundingClientRect();
      const wrapperRect = this.$refs.highlighterWrapper.getBoundingClientRect();

      // Calculate alignment metrics for debugging
      const horizontalOffset = Math.abs(textareaRect.left - highlightRect.left);
      const verticalOffset = Math.abs(textareaRect.top - highlightRect.top);
      const widthDiff = Math.abs(textareaRect.width - highlightRect.width);
      const heightDiff = Math.abs(textareaRect.height - highlightRect.height);

      // Check if alignment is within acceptable tolerance (1px)
      const tolerance = 1;
      const isAligned =
        horizontalOffset <= tolerance &&
        verticalOffset <= tolerance &&
        widthDiff <= tolerance &&
        heightDiff <= tolerance;

      if (!isAligned) {
        // Attempt to fix alignment issues
        this.fixAlignment();
      }
    },

    fixAlignment() {
      // Force re-application of styles if alignment is off
      setTimeout(() => {
        this.applyOverlayStyles();
      }, 100);
    },

    onWindowResize() {
      // Debounce resize events to avoid excessive recalculations
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        if (this.isActive) {
          this.applyOverlayStyles();
        }
      }, 150);
    },

    onTextareaInput() {
      // Debounce highlighting updates for performance
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        try {
          this.updateHighlighting();
        } catch (error) {
          console.warn("Highlighting update failed:", error);
        }
      }, 50); // Faster response for better UX
    },

    onTextareaScroll() {
      // Sync scroll position with the highlight layer
      if (this.$refs.highlightLayer && this.targetTextarea) {
        const highlightLayer = this.$refs.highlightLayer;
        const codeElement = highlightLayer.querySelector("code");

        // Sync scroll on both pre and code elements for maximum compatibility
        highlightLayer.scrollTop = this.targetTextarea.scrollTop;
        highlightLayer.scrollLeft = this.targetTextarea.scrollLeft;

        if (codeElement) {
          codeElement.scrollTop = this.targetTextarea.scrollTop;
          codeElement.scrollLeft = this.targetTextarea.scrollLeft;
        }

        // Also sync the wrapper scroll
        this.$refs.highlighterWrapper.scrollTop = this.targetTextarea.scrollTop;
        this.$refs.highlighterWrapper.scrollLeft =
          this.targetTextarea.scrollLeft;
      }
    },

    updateHighlighting() {
      if (!this.targetTextarea || !this.isActive) return;

      const text = this.targetTextarea.value;
      const newHighlightedContent = this.parseAndHighlightText(text);

      // Only update if content has changed to prevent unnecessary DOM updates
      if (newHighlightedContent !== this.highlightedContent) {
        this.highlightedContent = newHighlightedContent;

        // Sync scroll position after content update
        this.$nextTick(() => {
          this.onTextareaScroll();
        });
      }
    },

    parseAndHighlightText(text) {
      if (!text) return "";

      // Handle final newlines (CSS-Tricks technique) - critical for alignment
      if (text[text.length - 1] === "\n") {
        text += " "; // Add placeholder space for final line
      }

      // Handle tabs consistently
      text = text.replace(/\t/g, "    "); // Convert tabs to 4 spaces for consistency

      // Use a safe tokenization approach to prevent HTML corruption
      return this.tokenizeAndHighlight(text);
    },

    tokenizeAndHighlight(text) {
      // Split text into tokens while preserving all characters
      const tokens = [];
      let currentPos = 0;

      // First, find all LoRA/LyCORIS patterns
      const loraRegex = /<(lora|lyco):\s*([^:>]+)\s*(?::\s*[^>]+)?>/gi;
      const loraMatches = [];
      let match;

      while ((match = loraRegex.exec(text)) !== null) {
        loraMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: match[1], // 'lora' or 'lyco'
          name: match[2] ? match[2].trim() : "",
          fullMatch: match[0],
        });
      }

      // Process text character by character, handling LoRA patterns
      while (currentPos < text.length) {
        // Check if we're at the start of a LoRA pattern
        const loraMatch = loraMatches.find((m) => m.start === currentPos);

        if (loraMatch) {
          // Add LoRA token
          const exists =
            loraMatch.type === "lora"
              ? this.loraExists(loraMatch.name) !== false
              : this.lycoExists(loraMatch.name) !== false;

          const className = loraMatch.name
            ? exists
              ? "highlight-lora"
              : "highlight-lora-missing"
            : "highlight-lora-invalid";

          tokens.push({
            type: "lora",
            text: loraMatch.text,
            className: className,
          });

          currentPos = loraMatch.end;
        } else {
          // Find the next word or special character
          const remainingText = text.slice(currentPos);
          const wordMatch = remainingText.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)/);

          if (wordMatch) {
            // It's a word - check if it's an embedding
            const word = wordMatch[1];
            const isEmbedding = this.embeddingExists(word) !== false;

            tokens.push({
              type: isEmbedding ? "embedding" : "regular",
              text: word,
              className: isEmbedding
                ? "highlight-embedding"
                : "highlight-regular",
            });

            currentPos += word.length;
          } else {
            // It's a non-word character (space, punctuation, etc.)
            tokens.push({
              type: "text",
              text: text[currentPos],
              className: null,
            });

            currentPos++;
          }
        }
      }

      // Convert tokens to HTML with proper escaping
      return tokens
        .map((token) => {
          if (token.className) {
            const escapedText = this.escapeHtml(token.text);
            return `<span class="${token.className}">${escapedText}</span>`;
          } else {
            return this.escapeHtml(token.text);
          }
        })
        .join("");
    },

    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    cleanup() {
      if (this.targetTextarea) {
        this.targetTextarea.removeEventListener("input", this.onTextareaInput);
        this.targetTextarea.removeEventListener(
          "scroll",
          this.onTextareaScroll
        );

        // Restore original textarea styles
        this.targetTextarea.style.background = "";
        this.targetTextarea.style.color = "";
        this.targetTextarea.style.caretColor = "";
        this.targetTextarea.style.zIndex = "";
        this.targetTextarea.style.gridArea = "";
        this.targetTextarea.style.borderColor = "";
      }

      // Remove window resize listener
      window.removeEventListener("resize", this.onWindowResize);

      clearTimeout(this.debounceTimer);
      clearTimeout(this.resizeTimer);
      this.isActive = false;
    },
  },
};
</script>

<style scoped>
.syntax-highlighter-wrapper {
  pointer-events: none;
  z-index: 1;
  position: relative;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  overflow: hidden;
}

.highlight-background {
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  overflow: hidden !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  pointer-events: none !important;
  user-select: none !important;
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
}

.highlight-background code {
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
  word-spacing: inherit !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
}

/* Syntax highlighting colors - visible text colors */
:deep(.highlight-lora) {
  color: #ff6600 !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-lora-missing) {
  color: #ff6600 !important;
  text-decoration: underline wavy #ff0000 !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-lora-invalid) {
  color: #ff0000 !important;
  text-decoration: underline wavy #ff0000 !important;
  background: transparent !important;
}

:deep(.highlight-embedding) {
  color: #0066cc !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-regular) {
  color: #00cc66 !important;
  background: transparent !important;
}
</style>
