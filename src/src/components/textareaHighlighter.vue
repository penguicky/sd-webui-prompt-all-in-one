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

      // Dynamically determine optimal cursor color based on background
      const optimalCursorColor = this.getOptimalCursorColor();
      this.targetTextarea.style.caretColor = optimalCursorColor;

      this.targetTextarea.style.zIndex = "2";
      this.targetTextarea.style.resize = "none";
      this.targetTextarea.style.outline = "none";

      // Ensure cursor is always visible and properly styled
      this.targetTextarea.style.caretWidth = "2px";

      // Add focus event listener to enhance cursor visibility
      this.targetTextarea.addEventListener("focus", this.onTextareaFocus);
      this.targetTextarea.addEventListener("blur", this.onTextareaBlur);

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

    forceRefresh() {
      // Force a SAFE refresh for color updates (preserve content)
      if (!this.targetTextarea || !this.isActive) return;

      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.log("Force refreshing textarea highlighting...");
      }

      const text = this.targetTextarea.value;

      // SAFE APPROACH: Re-parse content with new colors without clearing
      const newHighlightedContent = this.parseAndHighlightText(text);
      this.highlightedContent = newHighlightedContent;

      // Single force update is sufficient
      this.$forceUpdate();

      // Sync scroll position
      this.$nextTick(() => {
        this.onTextareaScroll();

        // Gentle style recalculation
        if (this.$refs.highlightLayer) {
          this.$refs.highlightLayer.offsetHeight; // Single reflow
        }
      });
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

      // Process text character by character, handling enhanced syntax patterns
      while (currentPos < text.length) {
        // Try to parse category declaration syntax first (e.g., {category: term1, term2})
        const categoryDeclaration = this.parseCategoryDeclaration(
          text,
          currentPos
        );
        if (categoryDeclaration) {
          tokens.push(...categoryDeclaration.tokens);
          currentPos += categoryDeclaration.length;
          continue;
        }

        // Try to parse category reference syntax (e.g., {category})
        const categoryReference = this.parseCategoryReference(text, currentPos);
        if (categoryReference) {
          tokens.push(...categoryReference.tokens);
          currentPos += categoryReference.length;
          continue;
        }

        // Try to parse enhanced weight syntax (e.g., (term:1.2))
        const weightSyntax = this.parseWeightSyntax(text, currentPos);
        if (weightSyntax) {
          tokens.push(...weightSyntax.tokens);
          currentPos += weightSyntax.length;
          continue;
        }

        // Try to parse enhanced LoRA syntax with strength values (e.g., <lora:name:0.8>)
        const enhancedLoraSyntax = this.parseEnhancedLoraSyntax(
          text,
          currentPos
        );
        if (enhancedLoraSyntax) {
          tokens.push(...enhancedLoraSyntax.tokens);
          currentPos += enhancedLoraSyntax.length;
          continue;
        }

        // Try to parse embedding syntax (e.g., <embedding:name>)
        const embeddingSyntax = this.parseEmbeddingSyntax(text, currentPos);
        if (embeddingSyntax) {
          tokens.push(...embeddingSyntax.tokens);
          currentPos += embeddingSyntax.length;
          continue;
        }

        // Try to parse basic LoRA syntax without strength values (e.g., <lora:name>)
        const basicLoraRegex = /^<(lora|lyco):([^:>]+)>/;
        const remainingText = text.slice(currentPos);
        const basicLoraMatch = remainingText.match(basicLoraRegex);

        if (basicLoraMatch) {
          const [fullMatch, type, name] = basicLoraMatch;
          const exists =
            type === "lora"
              ? this.loraExists(name.trim()) !== false
              : this.lycoExists(name.trim()) !== false;

          const className = exists
            ? "highlight-lora"
            : "highlight-lora-missing";

          tokens.push({
            type: "lora",
            text: fullMatch,
            className: className,
          });

          currentPos += fullMatch.length;
          continue;
        }

        // Check for regular words (potential embeddings or regular terms)
        // Updated regex to include numeric prefixes for embeddings like 3d_model, 2girls, 1boy
        const wordMatch = remainingText.match(/^([a-zA-Z0-9_][a-zA-Z0-9_-]*)/);
        if (wordMatch) {
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
          continue;
        }

        // Handle bracket-based weight syntax (existing functionality)
        // Check for opening brackets that might indicate weight syntax
        const char = text[currentPos];
        if (char === "(" || char === "[" || char === "{") {
          // Look ahead to see if this is a simple bracket weight (not colon syntax)
          const bracketRegex =
            char === "("
              ? /^\(([^:)]+)\)/
              : char === "["
              ? /^\[([^\]:]+)\]/
              : /^\{([^:}]+)\}/;
          const bracketMatch = remainingText.match(bracketRegex);

          if (bracketMatch) {
            // This is a simple bracket weight, highlight as regular
            tokens.push({
              type: "text",
              text: char,
              className: "highlight-weight-punctuation",
            });
          } else {
            // Just a regular punctuation character
            tokens.push({
              type: "text",
              text: char,
              className: null,
            });
          }
        } else {
          // It's a non-word character (space, punctuation, etc.)
          tokens.push({
            type: "text",
            text: char,
            className: null,
          });
        }

        currentPos++;
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

    // Helper method to determine optimal cursor color based on background
    getOptimalCursorColor() {
      try {
        // Get the computed background color of the textarea or its parent
        const computedStyle = window.getComputedStyle(this.targetTextarea);
        const backgroundColor = computedStyle.backgroundColor;

        // If background is transparent, check parent elements
        if (
          backgroundColor === "transparent" ||
          backgroundColor === "rgba(0, 0, 0, 0)"
        ) {
          let parent = this.targetTextarea.parentElement;
          while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (
              parentStyle.backgroundColor !== "transparent" &&
              parentStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
            ) {
              return this.isDarkColor(parentStyle.backgroundColor)
                ? "#ffffff"
                : "#000000";
            }
            parent = parent.parentElement;
          }
        }

        // Check if the background color is dark or light
        return this.isDarkColor(backgroundColor) ? "#ffffff" : "#000000";
      } catch (error) {
        // Fallback to black cursor if detection fails
        console.warn(
          "Could not detect background color for cursor, using default:",
          error
        );
        return "#000000";
      }
    },

    // Helper method to determine if a color is dark
    isDarkColor(color) {
      try {
        // Handle different color formats
        if (color.startsWith("rgb")) {
          const matches = color.match(/\d+/g);
          if (matches && matches.length >= 3) {
            const r = parseInt(matches[0]);
            const g = parseInt(matches[1]);
            const b = parseInt(matches[2]);
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
          }
        }

        // For other color formats, assume light background
        return false;
      } catch (error) {
        // Default to light background assumption
        return false;
      }
    },

    // Helper function to parse and highlight weight syntax with colons
    parseWeightSyntax(text, startPos) {
      // Check for weight syntax like (term:1.2), [term:0.8], {term:1.5}
      const weightRegex = /^([\(\[\{])(.+?):(\-?[0-9\.]+)([\)\]\}])/;
      const remainingText = text.slice(startPos);
      const match = remainingText.match(weightRegex);

      if (match) {
        const [fullMatch, openBracket, term, weightStr, closeBracket] = match;
        const weight = parseFloat(weightStr);

        let weightClass = "highlight-regular";
        if (weight > 1.0) {
          weightClass = "highlight-weight-value-boost";
        } else if (weight < 1.0) {
          weightClass = "highlight-weight-value-reduce";
        }

        // Check if the term is an embedding
        const isEmbedding = this.embeddingExists(term.trim()) !== false;
        const termClass = isEmbedding
          ? "highlight-embedding"
          : "highlight-regular";

        return {
          tokens: [
            {
              type: "weight-punctuation",
              text: openBracket,
              className: "highlight-weight-punctuation",
            },
            { type: "weight-term", text: term, className: termClass },
            {
              type: "weight-punctuation",
              text: ":",
              className: "highlight-weight-punctuation",
            },
            { type: "weight-value", text: weightStr, className: weightClass },
            {
              type: "weight-punctuation",
              text: closeBracket,
              className: "highlight-weight-punctuation",
            },
          ],
          length: fullMatch.length,
        };
      }

      return null;
    },

    // Helper function to parse and highlight enhanced LoRA syntax
    parseEnhancedLoraSyntax(text, startPos) {
      // Check for LoRA syntax like <lora:name:0.8> or <lyco:name:1.2>
      const loraRegex = /^<(lora|lyco):([^:>]+):([^>]+)>/;
      const remainingText = text.slice(startPos);
      const match = remainingText.match(loraRegex);

      if (match) {
        const [fullMatch, type, name, strengthStr] = match;

        // Parse the strength value (could be just a number or have additional metadata)
        const strengthMatch = strengthStr.match(/^(\-?[0-9\.]+)/);

        const tokens = [
          {
            type: "lora-punctuation",
            text: "<",
            className: "highlight-lora-punctuation",
          },
          {
            type: "lora-type",
            text: type,
            className: "highlight-lora-punctuation",
          },
          {
            type: "lora-punctuation",
            text: ":",
            className: "highlight-lora-punctuation",
          },
        ];

        // Check if LoRA exists
        const exists =
          type === "lora"
            ? this.loraExists(name.trim()) !== false
            : this.lycoExists(name.trim()) !== false;

        const loraClassName = exists
          ? "highlight-lora"
          : "highlight-lora-missing";
        tokens.push({
          type: "lora-name",
          text: name,
          className: loraClassName,
        });

        if (strengthMatch) {
          const strength = parseFloat(strengthMatch[1]);
          let strengthClass = "highlight-regular";
          if (strength > 1.0) {
            strengthClass = "highlight-weight-value-boost";
          } else if (strength < 1.0) {
            strengthClass = "highlight-weight-value-reduce";
          }

          tokens.push({
            type: "lora-punctuation",
            text: ":",
            className: "highlight-lora-punctuation",
          });
          tokens.push({
            type: "lora-strength",
            text: strengthMatch[1],
            className: strengthClass,
          });

          // Add any remaining metadata after the strength value
          const remaining = strengthStr.substring(strengthMatch[1].length);
          if (remaining) {
            tokens.push({
              type: "lora-metadata",
              text: remaining,
              className: "highlight-regular",
            });
          }
        } else {
          tokens.push({
            type: "lora-punctuation",
            text: ":",
            className: "highlight-lora-punctuation",
          });
          tokens.push({
            type: "lora-strength",
            text: strengthStr,
            className: "highlight-regular",
          });
        }

        tokens.push({
          type: "lora-punctuation",
          text: ">",
          className: "highlight-lora-punctuation",
        });

        return {
          tokens: tokens,
          length: fullMatch.length,
        };
      }

      return null;
    },

    // Helper function to parse embedding syntax
    parseEmbeddingSyntax(text, startPos) {
      // Check for embedding syntax like <embedding:name>
      const embeddingRegex = /^<(embedding):([^>]+)>/;
      const remainingText = text.slice(startPos);
      const match = remainingText.match(embeddingRegex);

      if (match) {
        const [fullMatch, type, name] = match;
        const exists = this.embeddingExists(name.trim()) !== false;
        const embeddingClassName = exists
          ? "highlight-embedding"
          : "highlight-lora-missing";

        return {
          tokens: [
            {
              type: "embedding-punctuation",
              text: "<",
              className: "highlight-lora-punctuation",
            },
            {
              type: "embedding-type",
              text: type,
              className: "highlight-lora-punctuation",
            },
            {
              type: "embedding-punctuation",
              text: ":",
              className: "highlight-lora-punctuation",
            },
            {
              type: "embedding-name",
              text: name,
              className: embeddingClassName,
            },
            {
              type: "embedding-punctuation",
              text: ">",
              className: "highlight-lora-punctuation",
            },
          ],
          length: fullMatch.length,
        };
      }

      return null;
    },

    // Helper function to parse category declaration syntax
    parseCategoryDeclaration(text, startPos) {
      // Check for category declaration syntax like {category_name: term1, term2, term3}
      // Must contain colon followed by non-numeric content to distinguish from weight syntax
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}/;
      const remainingText = text.slice(startPos);
      const match = remainingText.match(categoryRegex);

      if (match) {
        const [fullMatch, categoryName, termsStr] = match;

        // Check if this is actually weight syntax (numeric value after colon)
        const isWeightSyntax = /^\s*\-?[0-9\.]+\s*$/.test(termsStr);
        if (isWeightSyntax) {
          return null; // Let weight syntax parser handle this
        }

        const tokens = [
          {
            type: "category-punctuation",
            text: "{",
            className: "highlight-weight-punctuation",
          },
          {
            type: "category-name",
            text: categoryName,
            className: "highlight-category-name",
          },
          {
            type: "category-punctuation",
            text: ":",
            className: "highlight-weight-punctuation",
          },
        ];

        // Parse individual terms within the category
        const terms = termsStr.split(",").map((term) => term.trim());

        for (let i = 0; i < terms.length; i++) {
          const term = terms[i];

          if (i > 0) {
            // Add comma separator
            tokens.push({
              type: "category-separator",
              text: ",",
              className: null,
            });
          }

          // Add space before each term (after colon or comma)
          tokens.push({
            type: "category-space",
            text: " ",
            className: null,
          });

          // Check if the term contains weight syntax and parse it recursively
          const weightSyntaxTokens = this.parseWeightSyntax(term, 0);
          if (weightSyntaxTokens) {
            // Term contains weight syntax, add the parsed tokens
            tokens.push(...weightSyntaxTokens.tokens);
            continue;
          }

          // Check if it's a LoRA with strength (complex format)
          const loraTokens = this.parseEnhancedLoraSyntax(term, 0);
          if (loraTokens) {
            // Parse the complex LoRA syntax within the category
            tokens.push(...loraTokens.tokens);
            continue;
          }

          // Check if it's an embedding syntax
          const embeddingTokens = this.parseEmbeddingSyntax(term, 0);
          if (embeddingTokens) {
            tokens.push(...embeddingTokens.tokens);
            continue;
          }

          // Determine term type and apply appropriate highlighting
          let termClassName = "highlight-regular";

          // Check if it's an embedding
          if (this.embeddingExists(term) !== false) {
            termClassName = "highlight-embedding";
          }
          // Check if it's a LoRA (basic format without strength)
          else if (term.match(/^<(lora|lyco):[^:>]+>$/)) {
            termClassName = "highlight-lora";
          }

          tokens.push({
            type: "category-term",
            text: term,
            className: termClassName,
          });
        }

        tokens.push({
          type: "category-punctuation",
          text: "}",
          className: "highlight-weight-punctuation",
        });

        return {
          tokens: tokens,
          length: fullMatch.length,
        };
      }

      return null;
    },

    // Helper function to parse category reference syntax
    parseCategoryReference(text, startPos) {
      // Check for category reference syntax like {category_name}
      // No colon, just a name within braces
      const categoryRefRegex = /^{([^:}]+)}$/;
      const remainingText = text.slice(startPos);
      const match = remainingText.match(categoryRefRegex);

      if (match) {
        const [fullMatch, categoryName] = match;

        return {
          tokens: [
            {
              type: "category-ref-punctuation",
              text: "{",
              className: "highlight-weight-punctuation",
            },
            {
              type: "category-ref-name",
              text: categoryName,
              className: "highlight-category-name",
            },
            {
              type: "category-ref-punctuation",
              text: "}",
              className: "highlight-weight-punctuation",
            },
          ],
          length: fullMatch.length,
        };
      }

      return null;
    },

    // Enhanced focus handling for better cursor visibility
    onTextareaFocus() {
      if (this.targetTextarea) {
        // Use a more prominent cursor color when focused
        this.targetTextarea.style.caretColor = "#007bff";
        // Ensure the cursor is visible
        this.targetTextarea.style.caretWidth = "2px";
      }
    },

    onTextareaBlur() {
      if (this.targetTextarea) {
        // Restore optimal cursor color when not focused
        const optimalCursorColor = this.getOptimalCursorColor();
        this.targetTextarea.style.caretColor = optimalCursorColor;
      }
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

        // Restore original textarea styles
        this.targetTextarea.style.background = "";
        this.targetTextarea.style.color = "";
        this.targetTextarea.style.caretColor = "";
        this.targetTextarea.style.caretWidth = "";
        this.targetTextarea.style.caretShape = "";
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
  color: var(--syntax-highlight-lora-names, #ff6600) !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-lora-missing) {
  color: var(--syntax-highlight-lora-names, #ff6600) !important;
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
  color: var(--syntax-highlight-embeddings, #0066cc) !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-regular) {
  color: var(--syntax-highlight-regular-terms, #00cc66) !important;
  background: transparent !important;
}

/* Enhanced weight and LoRA syntax highlighting */
:deep(.highlight-weight-punctuation) {
  color: var(--syntax-highlight-punctuation, #9966cc) !important;
  background: transparent !important;
}

:deep(.highlight-weight-value-boost) {
  color: var(--syntax-highlight-weight-boost, #00cc66) !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-weight-value-reduce) {
  color: var(--syntax-highlight-weight-reduce, #cc0066) !important;
  font-weight: 500 !important;
  background: transparent !important;
}

:deep(.highlight-lora-punctuation) {
  color: var(--syntax-highlight-punctuation, #9966cc) !important;
  background: transparent !important;
}

:deep(.highlight-category-name) {
  color: var(--syntax-highlight-category-names, #ff69b4) !important;
  font-weight: 500 !important;
  background: transparent !important;
}

/* Enhanced cursor visibility for highlighted textareas */
textarea[style*="color: transparent"] {
  caret-color: #000000 !important;
}

/* Dark theme support for cursor */
@media (prefers-color-scheme: dark) {
  textarea[style*="color: transparent"] {
    caret-color: #ffffff !important;
  }
}

/* Focus state enhancement for highlighted textareas */
textarea[style*="color: transparent"]:focus {
  caret-color: #007bff !important;
  outline: none !important;
}

/* Ensure cursor is visible during text selection */
textarea[style*="color: transparent"]::selection {
  background: rgba(0, 123, 255, 0.3) !important;
  color: transparent !important;
}
</style>
