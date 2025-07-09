<template>
  <div class="textarea-highlighter" ref="highlighterContainer">
    <!-- Highlighting overlay div that mirrors textarea content -->
    <div
      ref="highlightLayer"
      class="highlight-layer"
      :style="highlightLayerStyle"
      v-html="highlightedContent"
    ></div>
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
      highlightLayerStyle: {},
      isActive: false,
      resizeObserver: null,
      mutationObserver: null,
      debounceTimer: null,
      parentScrollListeners: [],
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

      // Position the highlighter container relative to the textarea
      this.positionHighlighter();

      // Set up event listeners
      this.targetTextarea.addEventListener("input", this.onTextareaInput);
      this.targetTextarea.addEventListener("scroll", this.onTextareaScroll);
      this.targetTextarea.addEventListener("focus", this.onTextareaFocus);
      this.targetTextarea.addEventListener("blur", this.onTextareaBlur);

      // Add window resize listener to reposition highlighter
      window.addEventListener("resize", this.positionHighlighter);

      // Add scroll listeners to parent containers to handle nested scrolling
      let parent = this.targetTextarea.parentElement;
      while (parent && parent !== document.body) {
        if (
          parent.scrollHeight > parent.clientHeight ||
          parent.scrollWidth > parent.clientWidth
        ) {
          parent.addEventListener("scroll", this.positionHighlighter);
          this.parentScrollListeners.push(parent);
        }
        parent = parent.parentElement;
      }

      // Initial highlighting
      this.updateHighlighting();

      this.isActive = true;
    },

    setupObservers() {
      // Watch for textarea resize
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.positionHighlighter();
        });
        this.resizeObserver.observe(this.targetTextarea);
      }

      // Watch for DOM changes that might affect textarea
      if (window.MutationObserver) {
        this.mutationObserver = new MutationObserver(() => {
          this.positionHighlighter();
        });
        this.mutationObserver.observe(this.targetTextarea.parentElement, {
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    },

    positionHighlighter() {
      if (!this.targetTextarea || !this.$refs.highlighterContainer) return;

      const textareaRect = this.targetTextarea.getBoundingClientRect();
      const textareaStyle = window.getComputedStyle(this.targetTextarea);

      // Get the textarea's parent container for proper positioning
      const textareaParent = this.targetTextarea.parentElement;
      const parentRect = textareaParent.getBoundingClientRect();

      // Position the highlighter container to match the textarea exactly
      const container = this.$refs.highlighterContainer;
      container.style.position = "absolute";
      container.style.left = textareaRect.left - parentRect.left + "px";
      container.style.top = textareaRect.top - parentRect.top + "px";
      container.style.width = textareaRect.width + "px";
      container.style.height = textareaRect.height + "px";
      container.style.pointerEvents = "none";
      container.style.zIndex = "1";

      // Insert the highlighter container right before the textarea in the DOM
      if (container.parentElement !== textareaParent) {
        textareaParent.insertBefore(container, this.targetTextarea);
      }

      // Make textarea background transparent and ensure proper layering
      this.targetTextarea.style.background = "transparent";
      this.targetTextarea.style.position = "relative";
      this.targetTextarea.style.zIndex = "2";

      // Update highlight layer style to match textarea exactly
      this.highlightLayerStyle = {
        position: "absolute",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        padding: textareaStyle.padding,
        margin: "0", // Remove margin to prevent offset
        border: textareaStyle.border,
        borderColor: "transparent",
        fontSize: textareaStyle.fontSize,
        fontFamily: textareaStyle.fontFamily,
        lineHeight: textareaStyle.lineHeight,
        letterSpacing: textareaStyle.letterSpacing,
        wordSpacing: textareaStyle.wordSpacing,
        textAlign: textareaStyle.textAlign,
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        overflow: "hidden",
        background: textareaStyle.background,
        color: "transparent", // Hide the duplicate text
        pointerEvents: "none",
        boxSizing: textareaStyle.boxSizing,
        scrollTop: this.targetTextarea.scrollTop + "px",
        scrollLeft: this.targetTextarea.scrollLeft + "px",
      };
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
      }, 100); // Increased debounce time for better performance
    },

    onTextareaScroll() {
      // Sync scroll position with the highlight layer
      if (this.$refs.highlightLayer && this.targetTextarea) {
        // Update the highlight layer's scroll position to match the textarea
        this.$refs.highlightLayer.scrollTop = this.targetTextarea.scrollTop;
        this.$refs.highlightLayer.scrollLeft = this.targetTextarea.scrollLeft;

        // Also update the style object for consistency
        this.highlightLayerStyle = {
          ...this.highlightLayerStyle,
          scrollTop: this.targetTextarea.scrollTop + "px",
          scrollLeft: this.targetTextarea.scrollLeft + "px",
        };
      }
    },

    onTextareaFocus() {
      this.isActive = true;
      this.updateHighlighting();
    },

    onTextareaBlur() {
      // Keep highlighting active even when not focused
      // this.isActive = false
    },

    updateHighlighting() {
      if (!this.targetTextarea || !this.isActive) return;

      const text = this.targetTextarea.value;
      const newHighlightedContent = this.parseAndHighlightText(text);

      // Only update if content has changed to prevent unnecessary DOM updates
      if (newHighlightedContent !== this.highlightedContent) {
        this.highlightedContent = newHighlightedContent;

        // Ensure positioning is correct after content update
        this.$nextTick(() => {
          this.positionHighlighter();
          this.onTextareaScroll(); // Sync scroll position
        });
      }
    },

    parseAndHighlightText(text) {
      if (!text) return "";

      // Performance optimization: limit text length for highlighting
      if (text.length > 10000) {
        console.warn(
          "Text too long for highlighting, truncating to 10000 characters"
        );
        text = text.substring(0, 10000) + "...";
      }

      // Use a more sophisticated parsing approach
      return this.parseTokensAndHighlight(text);
    },

    parseTokensAndHighlight(text) {
      // Escape HTML first
      const escapedText = this.escapeHtml(text);

      // Parse text into structured tokens
      const tokens = this.tokenizeText(escapedText);

      // Apply highlighting to each token
      return tokens.map((token) => this.highlightToken(token)).join("");
    },

    tokenizeText(text) {
      const tokens = [];
      let currentPos = 0;

      // Regex patterns for different token types
      const patterns = [
        // LoRA/LyCORIS patterns: <lora:name:weight> or <lyco:name:weight>
        {
          type: "lora",
          regex: /&lt;(lora|lyco):\s*([^&:]+)\s*(?::\s*([^&>]+))?&gt;/gi,
        },
        // Weight patterns: (text:1.2) or [text:0.8] or {text}
        {
          type: "weight",
          regex: /[\(\[\{][^)\]\}]*[\)\]\}]/g,
        },
        // Word boundaries for regular tokens
        {
          type: "word",
          regex: /[^\s,<>()[\]{}]+/g,
        },
        // Whitespace and separators
        {
          type: "separator",
          regex: /[\s,]+/g,
        },
      ];

      while (currentPos < text.length) {
        let bestMatch = null;
        let bestPattern = null;

        // Find the earliest match among all patterns
        for (const pattern of patterns) {
          pattern.regex.lastIndex = currentPos;
          const match = pattern.regex.exec(text);

          if (match && match.index === currentPos) {
            if (!bestMatch || match.index < bestMatch.index) {
              bestMatch = match;
              bestPattern = pattern;
            }
          }
        }

        if (bestMatch) {
          tokens.push({
            type: bestPattern.type,
            content: bestMatch[0],
            match: bestMatch,
            start: currentPos,
            end: currentPos + bestMatch[0].length,
          });
          currentPos += bestMatch[0].length;
        } else {
          // No pattern matched, take single character
          tokens.push({
            type: "char",
            content: text[currentPos],
            start: currentPos,
            end: currentPos + 1,
          });
          currentPos++;
        }
      }

      return tokens;
    },

    highlightToken(token) {
      switch (token.type) {
        case "lora":
          return this.highlightLoraToken(token);
        case "weight":
          return this.highlightWeightToken(token);
        case "word":
          return this.highlightWordToken(token);
        default:
          return token.content;
      }
    },

    highlightLoraToken(token) {
      const match = token.match;
      const loraType = match[1]; // 'lora' or 'lyco'
      const loraName = match[2] ? match[2].trim() : "";
      const weight = match[3] ? match[3].trim() : "";

      if (!loraName) {
        return `<span class="highlight-lora-invalid">${token.content}</span>`;
      }

      // Check if LoRA/LyCORIS exists
      const exists =
        loraType === "lora"
          ? this.loraExists(loraName) !== false
          : this.lycoExists(loraName) !== false;

      const className = exists ? "highlight-lora" : "highlight-lora-missing";
      return `<span class="${className}" title="${loraType}: ${loraName}${
        weight ? " (weight: " + weight + ")" : ""
      }">${token.content}</span>`;
    },

    highlightWeightToken(token) {
      const content = token.content;

      // Extract the inner content and check if it's an embedding
      const innerMatch = content.match(/^[\(\[\{]([^)\]\}]*)[\)\]\}]$/);
      if (innerMatch) {
        const innerContent = innerMatch[1].trim();

        // Check for weight syntax like "text:1.2"
        const weightMatch = innerContent.match(/^(.+?):\s*([\d.-]+)$/);
        if (weightMatch) {
          const term = weightMatch[1].trim();
          const weight = weightMatch[2];

          if (this.embeddingExists(term) !== false) {
            return `<span class="highlight-embedding-weight" title="Embedding: ${term} (weight: ${weight})">${token.content}</span>`;
          } else {
            return `<span class="highlight-regular-weight" title="Term: ${term} (weight: ${weight})">${token.content}</span>`;
          }
        } else {
          // No weight, just check if it's an embedding
          if (this.embeddingExists(innerContent) !== false) {
            return `<span class="highlight-embedding">${token.content}</span>`;
          } else {
            return `<span class="highlight-regular">${token.content}</span>`;
          }
        }
      }

      return `<span class="highlight-weight">${token.content}</span>`;
    },

    highlightWordToken(token) {
      const word = token.content.trim();

      if (!word) return token.content;

      // Check if it's an embedding
      const embeddingResult = this.embeddingExists(word);
      if (embeddingResult !== false) {
        return `<span class="highlight-embedding" title="Embedding: ${word}">${token.content}</span>`;
      }

      // Regular term
      return `<span class="highlight-regular">${token.content}</span>`;
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
        this.targetTextarea.removeEventListener("focus", this.onTextareaFocus);
        this.targetTextarea.removeEventListener("blur", this.onTextareaBlur);

        // Restore original textarea background
        this.targetTextarea.style.background = "";
        this.targetTextarea.style.position = "";
        this.targetTextarea.style.zIndex = "";
      }

      // Remove window resize listener
      window.removeEventListener("resize", this.positionHighlighter);

      // Remove parent scroll listeners
      this.parentScrollListeners.forEach((parent) => {
        parent.removeEventListener("scroll", this.positionHighlighter);
      });
      this.parentScrollListeners = [];

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }

      clearTimeout(this.debounceTimer);
      this.isActive = false;
    },
  },
};
</script>

<style scoped>
.textarea-highlighter {
  position: absolute;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.highlight-layer {
  position: absolute;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  z-index: 1;
}

/* Highlighting styles - Text color only, no backgrounds */
:deep(.highlight-lora) {
  color: #ff6600 !important;
}

:deep(.highlight-lora-missing) {
  color: #ff6600 !important;
  text-decoration: underline wavy #ff0000;
}

:deep(.highlight-lora-invalid) {
  color: #ff0000 !important;
  text-decoration: underline wavy #ff0000;
}

:deep(.highlight-embedding) {
  color: #0066cc !important;
}

:deep(.highlight-embedding-weight) {
  color: #0066cc !important;
}

:deep(.highlight-regular) {
  color: #00cc66 !important;
}

:deep(.highlight-regular-weight) {
  color: #00cc66 !important;
}

:deep(.highlight-weight) {
  color: #888888 !important;
  font-style: italic;
}
</style>
