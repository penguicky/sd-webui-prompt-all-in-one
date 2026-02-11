import common from "@/utils/common";
import autoSizeInput from "autosize-input";

export default {
  data() {
    return {
      tagClickTimeId: 0,
      showExtendId: "",
      categoryTermHoverData: null, // Store data about the hovered category term
      extendMenuMouseIn: false, // Track if mouse is in the extend menu
      extendMenuHideTimer: null, // Timer for delayed menu hiding
      modifiedTermValues: new Map(), // CRITICAL FIX: Store modified term values persistently in reactive data
    };
  },
  created() {
    // Non-reactive state for batched autoSizeInput calls
    this._pendingAutoSizeIds = new Set();
    this._autoSizeRafId = null;
    // Non-reactive state for batched _setTagHeight calls
    this._pendingHeightTagIds = new Set();
    this._heightRafId = null;
  },
  mounted() {
    /*common.gradioApp().addEventListener('mousemove', () => {
            this.$refs.highlightPrompt.hide()
        })*/

    // Set up event listeners for category term hover detection
    this.$nextTick(() => {
      this._setupCategoryTermHoverListeners();
    });
  },
  beforeUnmount() {
    if (this._autoSizeRafId) {
      cancelAnimationFrame(this._autoSizeRafId);
      this._autoSizeRafId = null;
    }
    if (this._heightRafId) {
      cancelAnimationFrame(this._heightRafId);
      this._heightRafId = null;
    }
  },
  methods: {
    _setTag(tag) {
      if (typeof tag["type"] === "string" && tag.type === "wrap") {
        tag.weightNum = 1;
        tag.incWeight = 0;
        tag.decWeight = 0;
      } else {
        tag.weightNum = common.getTagWeightNum(tag.value);
        // tag.weightNum = tag.weightNum <= 0 ? 1 : tag.weightNum
        // tag.weightNum = tag.weightNum === 0 ? 1 : tag.weightNum
        tag.incWeight = common.getTagIncWeight(
          tag.value,
          this.useNovelAiWeightSymbol
        );
        tag.decWeight = common.getTagDecWeight(tag.value);
        // const bracket = common.hasBrackets(tag.value)

        tag.originalValue = tag.value;
        if (
          !tag.value.match(common.loraRegex) &&
          !tag.value.match(common.lycoRegex)
        ) {
          // tag.weightNum = tag.weightNum <= 0 ? 1 : tag.weightNum
          let value = tag.value;
          const bracket = common.hasBrackets(value);
          if (
            (bracket[0] === "(" && bracket[1] === ")") ||
            (bracket[0] === "[" && bracket[1] === "]") ||
            (this.useNovelAiWeightSymbol &&
              bracket[0] === "{" &&
              bracket[1] === "}")
          ) {
            // 移除括号
            value = common.setLayers(value, 0, bracket[0], bracket[1]);
            // 移除权重数
            tag.originalValue = value.replace(common.weightNumRegex, "$1");
          }
        }
      }
      this._setTagClass(tag);
      this.$nextTick(() => {
        this._setTagHeight(tag);
        // Apply custom colors to newly created/updated tags
        if (this._applyCustomColorsToTags) {
          this._applyCustomColorsToTags();
        }
      });
    },
    _setTagHeight(tag) {
      // Batch tag height calculations: collect IDs and flush in a single rAF.
      // This replaces per-tag setInterval polling that caused layout thrashing
      // when many tags were created at once (e.g., pasting a 50-tag prompt).
      this._pendingHeightTagIds.add(tag.id);
      if (!this._heightRafId) {
        this._heightRafId = requestAnimationFrame(() => {
          this._heightRafId = null;
          const ids = [...this._pendingHeightTagIds];
          this._pendingHeightTagIds.clear();

          // Phase 1: READ — collect all offsetHeight values
          const measurements = [];
          for (const id of ids) {
            const valRef = this.$refs["promptTagValue-" + id];
            if (!valRef || !valRef[0]) continue;
            const $tag = valRef[0];
            measurements.push({
              id,
              height: $tag.offsetHeight,
              parent: $tag.parentNode,
              editRef: this.$refs["promptTagEdit-" + id],
              deleteRef: this.$refs["promptTagDelete-" + id],
            });
          }

          // Phase 2: WRITE — apply all heights without interleaved reads
          for (const m of measurements) {
            const h = m.height + "px";
            m.parent.style.height = h;
            if (m.editRef && m.editRef[0]) m.editRef[0].style.height = h;
            if (m.deleteRef && m.deleteRef[0]) m.deleteRef[0].style.height = h;
          }
        });
      }
    },
    _getTagType(tag) {},
    _setTagClass(tag) {
      tag.isLora = false;
      tag.loraExists = false;
      tag.isLyco = false;
      tag.lycoExists = false;
      tag.isEmbedding = false;

      if (typeof tag["type"] === "string" && tag.type === "wrap") {
      } else {
        // 判断是否lora
        const match = tag.value.match(common.loraRegex);
        if (match) {
          tag.isLora = true;
          tag.loraName = match[1];
          const loraName = this.loraExists(match[1]);
          if (loraName !== false) {
            tag.loraExists = true;
          }
        }

        if (!tag.isLora) {
          // 判断是否lyco
          const match = tag.value.match(common.lycoRegex);
          if (match) {
            tag.isLyco = true;
            tag.lycoName = match[1];
            const lycoName = this.lycoExists(match[1]);
            if (lycoName !== false) {
              tag.lycoExists = true;
            }
          }
        }

        if (!tag.isLora && !tag.isLyco) {
          // 判断是否embedding
          const embeddingName = this.embeddingExists(tag.value);
          if (embeddingName !== false) {
            tag.isEmbedding = true;
            tag.value = embeddingName;
            tag.embeddingName = embeddingName;
          } else {
            const embeddingName = this.embeddingExists(tag.originalValue);
            if (embeddingName !== false) {
              tag.isEmbedding = true;
              // tag.value = embeddingName
              tag.embeddingName = embeddingName;
            }
          }
        }
      }

      let classes = ["prompt-tag-value"];
      if (tag.isLora) {
        classes.push("lora-tag");
        if (!tag.loraExists) {
          classes.push("lora-not-exists");
        }
      } else if (tag.isLyco) {
        classes.push("lyco-tag");
        if (!tag.lycoExists) {
          classes.push("lyco-not-exists");
        }
      } else if (tag.isEmbedding) {
        classes.push("embedding-tag");
      } else if (this.neg) {
        classes.push("neg-tag");
      } else {
        // Regular terms get green highlighting
        classes.push("regular-tag");
      }

      tag.classes = classes;
      return classes;
    },
    _setTagById(id, value = null) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      if (value !== null) tag.value = value;
      return tag;
    },
    _isTagBlacklist(tag) {
      if (typeof tag["type"] === "string" && tag.type === "wrap") return false;
      if (tag.isLora) {
        if (this.blacklist.lora?.includes(tag.loraName.toLowerCase()))
          return true;
      } else if (tag.isLyco) {
        if (this.blacklist.lycoris?.includes(tag.lycoName.toLowerCase()))
          return true;
      } else if (tag.isEmbedding) {
        if (this.blacklist.embedding?.includes(tag.embeddingName.toLowerCase()))
          return true;
      } else {
        if (this.neg) {
          if (
            this.blacklist.negative_prompt?.includes(
              tag.originalValue.toLowerCase()
            )
          )
            return true;
        } else {
          if (this.blacklist.prompt?.includes(tag.originalValue.toLowerCase()))
            return true;
        }
      }
      return false;
    },
    _appendTag(
      value,
      _localValue = "",
      disabled = false,
      index = -1,
      type = "text"
    ) {
      if (value === "") return -1;
      // 唯一数：当前时间戳+随机数
      const id = Date.now() + (Math.random() * 1000000).toFixed(0);
      let tag = {
        id,
        value:
          value === null || value === undefined || value === false ? "" : value,
        disabled,
        type,
      };
      this._setTag(tag);
      // value           = common.setLayers(value, 0, '(', ')')
      // value           = common.setLayers(value, 0, '[', ']')
      if (this._isTagBlacklist(tag)) return -1;
      if (index >= 0) {
        // 插入到指定位置
        this.tags.splice(index, 0, tag);
      } else {
        index = this.tags.push(tag);
      }
      // Batch autoSizeInput calls — collect IDs and flush in a single rAF
      this._pendingAutoSizeIds.add(id);
      if (!this._autoSizeRafId) {
        this._autoSizeRafId = requestAnimationFrame(() => {
          this._autoSizeRafId = null;
          const ids = this._pendingAutoSizeIds;
          this._pendingAutoSizeIds = new Set();
          ids.forEach((tagId) => {
            const ref = this.$refs["promptTagEdit-" + tagId];
            if (ref && ref[0]) autoSizeInput(ref[0]);
          });
        });
      }
      return index - 1;
    },
    // Helper function to highlight weight syntax with colons
    _highlightWeightSyntax(value) {
      // Check for weight syntax like (term:1.2), [term:0.8], {term:1.5}
      const weightRegex = /^([\(\[\{])(.+):(\-?[0-9\.]+)([\)\]\}])$/;
      const match = value.match(weightRegex);

      if (match) {
        const [, openBracket, term, weightStr, closeBracket] = match;
        const weight = parseFloat(weightStr);

        let weightClass = "character";
        if (weight > 1.0) {
          weightClass = "weight-value-boost";
        } else if (weight < 1.0) {
          weightClass = "weight-value-reduce";
        }

        // Check if the term is an embedding
        const isEmbedding = this.embeddingExists(term.trim()) !== false;
        const termClass = isEmbedding ? "embedding-content" : "character";

        return `<span class="weight-punctuation">${openBracket}</span><span class="${termClass}">${common.escapeHtml(
          term
        )}</span><span class="weight-punctuation">:</span><span class="${weightClass}">${weightStr}</span><span class="weight-punctuation">${closeBracket}</span>`;
      }

      return null;
    },

    // Helper function to highlight LoRA syntax
    _highlightLoraSyntax(value) {
      // Check for LoRA syntax like <lora:name:0.8> or <lyco:name:1.2>
      // Only highlight if it has a strength value (colon syntax)
      const loraRegex = /^<(lora|lyco):([^:>]+):([^>]+)>/;
      const match = value.match(loraRegex);

      if (match) {
        const [, type, name, strengthStr] = match;
        let result = `<span class="lora-punctuation">&lt;</span><span class="lora-punctuation">${type}</span><span class="lora-punctuation">:</span><span class="lora-content">${common.escapeHtml(
          name
        )}</span>`;

        // Parse the strength value (could be just a number or have additional metadata)
        const strengthMatch = strengthStr.match(/^(\-?[0-9\.]+)/);
        if (strengthMatch) {
          const strength = parseFloat(strengthMatch[1]);
          let strengthClass = "character";
          if (strength > 1.0) {
            strengthClass = "weight-value-boost";
          } else if (strength < 1.0) {
            strengthClass = "weight-value-reduce";
          }

          result += `<span class="lora-punctuation">:</span><span class="${strengthClass}">${strengthMatch[1]}</span>`;

          // Add any remaining metadata after the strength value
          const remaining = strengthStr.substring(strengthMatch[1].length);
          if (remaining) {
            result += `<span class="character">${common.escapeHtml(
              remaining
            )}</span>`;
          }
        } else {
          result += `<span class="lora-punctuation">:</span><span class="character">${common.escapeHtml(
            strengthStr
          )}</span>`;
        }

        result += `<span class="lora-punctuation">&gt;</span>`;
        return result;
      }

      return null;
    },

    // Helper function to highlight category declaration syntax
    _highlightCategoryDeclaration(value) {
      // Check for category declaration syntax like {category_name: term1, term2, term3}
      // Must contain colon followed by non-numeric content to distinguish from weight syntax
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = value.match(categoryRegex);

      if (match) {
        const [, categoryName, termsStr] = match;

        // Check if this is actually weight syntax (numeric value after colon)
        const isWeightSyntax = /^\s*\-?[0-9\.]+\s*$/.test(termsStr);
        if (isWeightSyntax) {
          return null; // Let weight syntax parser handle this
        }

        let result = `<span class="weight-punctuation">{</span><span class="category-name">${common.escapeHtml(
          categoryName
        )}</span><span class="weight-punctuation">:</span>`;

        // Parse individual terms within the category
        const terms = termsStr.split(",").map((term) => term.trim());

        for (let i = 0; i < terms.length; i++) {
          let term = terms[i];

          // CRITICAL FIX: Check if we have a stored modified value for this term
          // This prevents LoRA weight loss after DOM re-rendering
          const tagId = this._getCurrentTagId(value);
          if (tagId) {
            const storedValue = this._getStoredModifiedTermValue(tagId, i);
            if (storedValue) {
              term = storedValue;
            }
          }

          if (i > 0) {
            result += ",";
          }

          // Add space before each term (after colon or comma)
          result += " ";

          // Generate unique identifier for this term within the category
          const termId = `category-term-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}-${i}`;

          // Check if the term contains weight syntax and parse it recursively
          const weightHighlight = this._highlightWeightSyntax(term);
          if (weightHighlight) {
            // Term contains weight syntax, wrap in hoverable span
            result += `<span class="category-term-wrapper" data-term-id="${termId}" data-term-value="${common.escapeHtml(
              term
            )}" data-term-index="${i}">${weightHighlight}</span>`;
            continue;
          }

          // Check if it's a LoRA with strength (complex format)
          const loraHighlight = this._highlightLoraSyntax(term);
          if (loraHighlight) {
            // Parse the complex LoRA syntax within the category, wrap in hoverable span
            result += `<span class="category-term-wrapper" data-term-id="${termId}" data-term-value="${common.escapeHtml(
              term
            )}" data-term-index="${i}">${loraHighlight}</span>`;
            continue;
          }

          // Determine term type and apply appropriate highlighting
          let termClass = "character";

          // Check if it's an embedding (extract base term first)
          const baseTerm = this._extractBaseTerm(term);
          if (this.embeddingExists(baseTerm) !== false) {
            termClass = "embedding-content";
          }
          // Check if it's a basic LoRA (without strength) - use lora-content class for orange highlighting
          else if (term.match(/^<(lora|lyco):[^:>]+>$/)) {
            termClass = "lora-content";
          }

          // Wrap individual term in hoverable span with data attributes
          result += `<span class="category-term-wrapper" data-term-id="${termId}" data-term-value="${common.escapeHtml(
            term
          )}" data-term-index="${i}"><span class="${termClass}">${common.escapeHtml(
            term
          )}</span></span>`;
        }

        result += `<span class="weight-punctuation">}</span>`;
        return result;
      }

      return null;
    },

    // Helper function to highlight category reference syntax
    _highlightCategoryReference(value) {
      // Check for category reference syntax like {category_name}
      // No colon, just a name within braces
      const categoryRefRegex = /^{([^:}]+)}$/;
      const match = value.match(categoryRefRegex);

      if (match) {
        const [, categoryName] = match;

        return `<span class="weight-punctuation">{</span><span class="category-name">${common.escapeHtml(
          categoryName
        )}</span><span class="weight-punctuation">}</span>`;
      }

      return null;
    },

    renderTag(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return "";
      let value = tag.value;
      if (
        value === "BREAK" &&
        (this.autoBreakBeforeWrap || this.autoBreakAfterWrap)
      ) {
        value =
          '<div class="break-character">---------------------</div> <div class="character">BREAK</div> <div class="break-character">---------------------</div>';
      } else {
        // First try to highlight category declaration syntax
        const categoryDeclaration = this._highlightCategoryDeclaration(value);
        if (categoryDeclaration) {
          value = '<div class="character">' + categoryDeclaration + "</div>";
        } else {
          // Then try to highlight category reference syntax
          const categoryReference = this._highlightCategoryReference(value);
          if (categoryReference) {
            value = '<div class="character">' + categoryReference + "</div>";
          } else {
            // Then try to highlight LoRA syntax
            const loraHighlight = this._highlightLoraSyntax(value);
            if (loraHighlight) {
              value = '<div class="character">' + loraHighlight + "</div>";
            } else {
              // Then try to highlight weight syntax with colons
              const weightHighlight = this._highlightWeightSyntax(value);
              if (weightHighlight) {
                value = '<div class="character">' + weightHighlight + "</div>";
              } else {
                // Fall back to existing bracket-based weight handling
                // But only if there's no colon syntax present
                const hasColonSyntax = common.weightNumRegex.test(value);

                value = common.escapeHtml(value);
                if (!hasColonSyntax && tag.incWeight > 0) {
                  if (this.useNovelAiWeightSymbol) {
                    value = common.setLayers(value, 0, "{", "}");
                    value = '<div class="character">' + value + "</div>";
                    let start =
                      '<div class="weight-character">' +
                      "{".repeat(tag.incWeight) +
                      "</div>";
                    let end =
                      '<div class="weight-character">' +
                      "}".repeat(tag.incWeight) +
                      "</div>";
                    value = start + value + end;
                  } else {
                    value = common.setLayers(value, 0, "(", ")");
                    value = '<div class="character">' + value + "</div>";
                    let start =
                      '<div class="weight-character">' +
                      "(".repeat(tag.incWeight) +
                      "</div>";
                    let end =
                      '<div class="weight-character">' +
                      ")".repeat(tag.incWeight) +
                      "</div>";
                    value = start + value + end;
                  }
                } else if (!hasColonSyntax && tag.decWeight > 0) {
                  value = common.setLayers(value, 0, "[", "]");
                  value = '<div class="character">' + value + "</div>";
                  let start =
                    '<div class="weight-character">' +
                    "[".repeat(tag.decWeight) +
                    "</div>";
                  let end =
                    '<div class="weight-character">' +
                    "]".repeat(tag.decWeight) +
                    "</div>";
                  value = start + value + end;
                } else {
                  value = '<div class="character">' + value + "</div>";
                }
              }
            }
          }
        }
      }
      return value;
    },
    isFavorite(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      if (typeof window.phystonPromptfavorites === "object") {
        for (const group of window.phystonPromptfavorites) {
          if (group.key !== this.favoriteKey) continue;
          for (const favorite of group.list) {
            if (favorite.tags.length !== 1) continue;
            if (favorite.tags[0].value === tag.value) return favorite.id;
          }
        }
      }
      return false;
    },
    onLoraPopupUseKeywords(keywords) {
      let indexes = [];
      for (let keyword of keywords) {
        let temp = keyword.toLowerCase();
        let find = this.tags.find((tag) => tag.value.toLowerCase() === temp);
        if (!find) {
          let index = this._appendTag(keyword, "", false, -1, "text");
          if (index !== -1) indexes.push(index);
        }
      }
      if (indexes.length) {
        this.updatePrompt();
        this.updateTags();
      }
    },
    onTagMouseEnter(id) {
      if (this.isEditing) return false;
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      tag.isFavorite = this.isFavorite(tag.id);
      if (this.hotkey.hover === "extend") this.showExtendId = id;
      if (tag.isLora || tag.isLyco || tag.isEmbedding) {
        let name = tag.isLora
          ? tag.loraName
          : tag.isLyco
          ? tag.lycoName
          : tag.embeddingName;
        this.$emit(
          "showExtraNetworks",
          this.$refs["promptTagValue-" + tag.id][0],
          name,
          this.onLoraPopupUseKeywords,
          "tags"
        );
      }
    },
    onTagMouseMove(id) {
      /*let tag = this.tags.find(tag => tag.id === id)
            if (!tag) return false
            this.$refs.highlightPrompt.show(tag)*/
    },
    onTagMouseLeave(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      if (this.hotkey.hover === "extend") {
        // If we're showing extend menu for a category term, use delayed hiding
        if (
          this.categoryTermHoverData &&
          this.categoryTermHoverData.tag.id === id
        ) {
          this._hideExtendMenuDelayed();
        } else {
          // For regular tags, hide immediately
          this.showExtendId = "";
        }
      }
      this.$emit("hideExtraNetworks");
    },
    onTagClick(id) {
      if (this.tagClickTimeId) clearTimeout(this.tagClickTimeId);
      this.tagClickTimeId = setTimeout(() => {
        switch (this.hotkey.click) {
          case "edit":
            this._handleEditTag(id);
            break;
          case "disable":
            this._handleDisableTag(id);
            break;
          case "extend":
            this._handleHoverTag(id);
            break;
        }
        clearTimeout(this.tagClickTimeId);
      }, 250);
    },
    onTagDblclick(id) {
      clearTimeout(this.tagClickTimeId);
      switch (this.hotkey.dblClick) {
        case "edit":
          this._handleEditTag(id);
          break;
        case "disable":
          this._handleDisableTag(id);
          break;
        case "extend":
          this._handleHoverTag(id);
          break;
      }
    },
    onTagRightClick(id, e) {
      switch (this.hotkey.rightClick) {
        case "edit":
          this._handleEditTag(id);
          break;
        case "disable":
          this._handleDisableTag(id);
          break;
        case "extend":
          this._handleHoverTag(id);
          break;
      }
    },
    _handleEditTag(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      this.editing = {};
      this.editing[tag.id] = true;
      this.isEditing = true;
      this.$forceUpdate();
      this.$nextTick(() => {
        const input = this.$refs["promptTagEdit-" + tag.id][0];
        input.focus();
        input.dispatchEvent(new Event("input"));
        // input.select()
      });
    },
    _handleDisableTag(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      this.onDisabledTagClick(tag.id);
    },
    _handleHoverTag(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      this.showExtendId = id;
    },
    onTagInputBlur(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      this.editing[tag.id] = false;
      this.isEditing = false;
    },
    onTagInputKeyDown(id, e) {
      if (e.keyCode === 13) {
        let tag = this.tags.find((tag) => tag.id === id);
        if (!tag) return false;
        this.editing[tag.id] = false;
        this.isEditing = false;
        this._changeTagValue(tag, e.target.value);
      }
    },
    onTagInputChange(id, e) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      this._changeTagValue(tag, e.target.value);
    },
    _changeTagValue(tag, newValue) {
      let oldValue = tag.value;
      if (tag.value !== newValue) {
        tag.value = newValue;
        this._setTag(tag);
        if (this._isTagBlacklist(tag)) {
          tag.value = oldValue;
          this._setTag(tag);
        }
        // Use debounced update for user input changes
        this.updateTagsDebounced(150);
      }
    },
    onTagWeightNumChange(id, e) {
      // Check if we're working with a category term
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === id
      ) {
        const { tag, termValue, termIndex } = this.categoryTermHoverData;
        const newWeight =
          typeof e === "number" || typeof e === "string" ? e : e.target.value;
        this._modifyCategoryTerm(tag, termIndex, termValue, "set", newWeight);
        return;
      }

      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      e = typeof e === "number" || typeof e === "string" ? e : e.target.value;
      if (tag.weightNum == e) return;
      let weightNum = e;
      let value = tag.value;
      if (weightNum !== 0) {
        if (weightNum === 1 && !this.autoKeepWeightOne) {
          // 如果权重数是1，那么就去掉权重数
          const bracket = common.hasBrackets(value);
          if (
            (bracket[0] === "(" && bracket[1] === ")") ||
            (this.useNovelAiWeightSymbol &&
              bracket[0] === "{" &&
              bracket[1] === "}")
          ) {
            // 移除括号
            value = common.setLayers(value, 0, bracket[0], bracket[1]);
          } else {
            // 不移除括号
          }
          // 移除权重数
          value = value.replace(common.weightNumRegex, "$1");
        } else {
          // 如果原来没有权重数，那么就加上权重数
          if (!common.weightNumRegex.test(value)) {
            // 如果原来有括号，就要加到括号内
            let bracket = common.hasBrackets(value);
            if (bracket) {
              value = common.setLayers(
                value,
                1,
                bracket[0],
                bracket[1],
                ":" + weightNum
              );
            } else {
              value = value + ":" + weightNum;
            }
          }
          // 排除Lora、lyco (但包含embedding，因为embedding需要标准权重语法)
          // 如果原来没有括号() [] {}，那么就加上括号
          if (tag.isLora || tag.isLyco) {
            // LoRA和LyCORIS使用自己的语法格式，不需要额外括号
          } else if (!common.hasBrackets(value)) {
            // 对于embeddings和常规terms，添加标准权重括号
            if (this.useNovelAiWeightSymbol) {
              value = common.setLayers(value, 1, "{", "}");
            } else {
              value = common.setLayers(value, 1, "(", ")");
            }
          }
        }
        if (value !== tag.value) {
          tag.value = value;
          this._setTag(tag);
        }
      } else {
        if (this.autoKeepWeightZero) {
          // 保留权重数
          tag.value = value.replace(common.weightNumRegex, "$1:0");
        } else {
          // 移除权重数
          tag.value = value.replace(common.weightNumRegex, "$1");
        }
      }
      tag.weightNum = weightNum;
      this.updateTagsDebounced(100);
    },
    onDeleteTagClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;

      // Clear any stored modified term values for this tag
      this._clearAllStoredModifiedTermValues(id);

      let index = this.tags.indexOf(tag);
      this.tags.splice(index, 1);
      // Use immediate update for deletions
      this.updateTagsImmediate();
    },

    // New method for deleting individual category terms
    onDeleteTermClick(id) {
      // Check if we're working with a category term
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === id
      ) {
        const { tag, termValue, termIndex } = this.categoryTermHoverData;
        this._deleteCategoryTerm(tag, termIndex);
        return;
      }

      // For regular tags, use the standard delete functionality
      this.onDeleteTagClick(id);
    },
    onFavoriteTagClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      let favoriteId = this.isFavorite(tag.id);
      if (!favoriteId) {
        // 收藏
        this.gradioAPI
          .pushFavorite(
            this.favoriteKey,
            [tag],
            tag.value,
            tag.value
          )
          .then((res) => {
            if (res) {
              tag.isFavorite = true;
              this.$emit("refreshFavorites", this.favoriteKey);
            }
          });
      } else {
        // 取消收藏
        this.gradioAPI.unFavorite(this.favoriteKey, favoriteId).then((res) => {
          if (res) {
            tag.isFavorite = false;
            this.$emit("refreshFavorites", this.favoriteKey);
          }
        });
      }
    },
    onDisabledTagClick(id) {
      // Check if we're working with a category term
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === id
      ) {
        const { tag, termValue, termIndex } = this.categoryTermHoverData;
        this._disableCategoryTerm(tag, termIndex, termValue);
        return;
      }

      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      tag.disabled = !tag.disabled;
      this.updateTagsDebounced(100);
    },
    onIncWeightClick(id, num) {
      // Check if we're working with a category term
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === id
      ) {
        const { tag, termValue, termIndex } = this.categoryTermHoverData;
        this._modifyCategoryTerm(tag, termIndex, termValue, "inc", num);
        return;
      }

      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      let value = tag.value;
      value = common.setLayers(value, 0, "[", "]");
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, 0, "(", ")");
      }
      let incWeight = tag.incWeight;
      incWeight += num;
      if (incWeight < 0) incWeight = 0;
      tag.incWeight = incWeight;
      tag.decWeight = 0;
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, incWeight, "{", "}");
      } else {
        value = common.setLayers(value, incWeight, "(", ")");
      }
      tag.value = value;
      this.updateTagsDebounced(100);
    },
    onDecWeightClick(id, num) {
      // Check if we're working with a category term
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === id
      ) {
        const { tag, termValue, termIndex } = this.categoryTermHoverData;
        this._modifyCategoryTerm(tag, termIndex, termValue, "dec", num);
        return;
      }

      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      let value = tag.value;
      value = common.setLayers(value, 0, "(", ")");
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, 0, "{", "}");
      }
      let decWeight = tag.decWeight;
      decWeight += num;
      if (decWeight < 0) decWeight = 0;
      tag.incWeight = 0;
      tag.decWeight = decWeight;
      value = common.setLayers(value, decWeight, "[", "]");
      tag.value = value;
      this.updateTagsDebounced(100);
    },
    onWrapTagClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      let index = this.tags.indexOf(tag);
      let wrapIndex = this._appendTag("\n", "\n", false, -1, "wrap");
      let wrapTag = this.tags[wrapIndex];
      // 移动到当前标签的下面
      this.tags.splice(wrapIndex, 1);
      // 然后将 'c' 插入到 'e' 后面
      this.tags.splice(index + 1, 0, wrapTag);
      this.updateTags();
    },
    onBlacklistClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;

      if (!this.cancelBlacklistConfirm) {
        let title =
          this.getLang("confirm_add_blacklist").replace("{0}", tag.value) +
          "\n" +
          this.getLang("blacklist_desc");
        if (!confirm(title)) return;
      }

      let blacklist = JSON.parse(JSON.stringify(this.blacklist));
      if (tag.isLora) {
        blacklist.lora.push(tag.loraName);
      } else if (tag.isLyco) {
        blacklist.lycoris.push(tag.lycoName);
      } else if (tag.isEmbedding) {
        blacklist.embedding.push(tag.embeddingName);
      } else {
        if (this.neg) {
          blacklist.negative_prompt.push(tag.originalValue);
        } else {
          blacklist.prompt.push(tag.originalValue);
        }
      }
      this.gradioAPI.setData("blacklist", blacklist);
      this.$emit("update:blacklist", blacklist, this.cancelBlacklistConfirm);

      this.tags.forEach((item) => {
        if (item.value === tag.value) {
          this.onDeleteTagClick(item.id);
        }
      });
    },

    // Setup event listeners for category term hover detection
    _setupCategoryTermHoverListeners() {
      // Use event delegation to handle dynamically created category term wrappers
      const container = this.$el;
      if (!container) return;

      // Remove existing listeners to prevent duplicates
      container.removeEventListener(
        "mouseenter",
        this._onCategoryTermMouseEnter,
        true
      );
      container.removeEventListener(
        "mouseleave",
        this._onCategoryTermMouseLeave,
        true
      );

      // Add new listeners with capture phase to catch events before they bubble
      container.addEventListener(
        "mouseenter",
        this._onCategoryTermMouseEnter,
        true
      );
      container.addEventListener(
        "mouseleave",
        this._onCategoryTermMouseLeave,
        true
      );
    },

    // Handle mouse enter on category terms
    _onCategoryTermMouseEnter(event) {
      const target = event.target;
      const termWrapper = target.closest(".category-term-wrapper");

      if (termWrapper && this.hotkey.hover === "extend") {
        const termId = termWrapper.getAttribute("data-term-id");
        const termValue = termWrapper.getAttribute("data-term-value");
        const termIndex = parseInt(termWrapper.getAttribute("data-term-index"));

        // Find the parent tag that contains this category
        const tagElement = termWrapper.closest(".prompt-tag");
        if (!tagElement) return;

        const tagId = tagElement.getAttribute("data-id");
        const tag = this.tags.find((t) => t.id === tagId);
        if (!tag) return;

        // Calculate position of the term wrapper for menu positioning
        const rect = termWrapper.getBoundingClientRect();
        const tagRect = tagElement.getBoundingClientRect();

        // Critical fix: Check if we have updated term value stored for this exact term
        // This prevents LoRA weight loss by using the most recent modified value
        let finalTermValue = termValue;

        // First check if we have a stored modified value for this term
        const storedValue = this._getStoredModifiedTermValue(tagId, termIndex);
        if (storedValue) {
          finalTermValue = common.escapeHtml(storedValue);
        }
        // Fallback to current hover data if available
        else if (
          this.categoryTermHoverData &&
          this.categoryTermHoverData.tag.id === tagId &&
          this.categoryTermHoverData.termIndex === termIndex &&
          this.categoryTermHoverData.termValue
        ) {
          // Use the updated term value from previous modification
          finalTermValue = common.escapeHtml(
            this.categoryTermHoverData.termValue
          );
        }

        // Store category term hover data with position information
        // CRITICAL FIX: Only unescape if the value is actually HTML-encoded
        // This prevents unnecessary DOM operations during hover events
        let unescapedTermValue = finalTermValue;
        if (finalTermValue && finalTermValue.includes("&")) {
          unescapedTermValue = this._unescapeHtml(finalTermValue);
        }

        this.categoryTermHoverData = {
          tagId: tagId,
          tag: tag,
          termId: termId,
          termValue: unescapedTermValue,
          termIndex: termIndex,
          termWrapper: termWrapper,
          position: {
            left: rect.left - tagRect.left,
            top: rect.top - tagRect.top,
            width: rect.width,
            height: rect.height,
          },
        };

        // Use the existing showExtendId system but for the parent tag
        this.showExtendId = tagId;

        // Prevent the normal tag hover from triggering
        event.stopPropagation();
      }
    },

    // Handle mouse leave on category terms
    _onCategoryTermMouseLeave(event) {
      const target = event.target;
      const termWrapper = target.closest(".category-term-wrapper");

      if (termWrapper && this.categoryTermHoverData) {
        const termId = termWrapper.getAttribute("data-term-id");

        if (this.categoryTermHoverData.termId === termId) {
          // Use delayed hiding to allow mouse to move to extend menu
          this._hideExtendMenuDelayed();

          // Critical fix: Don't clear categoryTermHoverData immediately
          // Store the modified term values for future hover events
          this._storeModifiedTermValue(
            this.categoryTermHoverData.tag.id,
            this.categoryTermHoverData.termIndex,
            this.categoryTermHoverData.termValue
          );
        }

        // Prevent the normal tag hover from triggering
        event.stopPropagation();
      }
    },

    // Handle delayed hiding of extend menu
    _hideExtendMenuDelayed() {
      if (this.extendMenuHideTimer) {
        clearTimeout(this.extendMenuHideTimer);
      }

      this.extendMenuHideTimer = setTimeout(() => {
        this.extendMenuHideTimer = null;
        if (!this.extendMenuMouseIn) {
          this.showExtendId = "";
          this.categoryTermHoverData = null;
        }
      }, 100); // Small delay to allow mouse to move to menu
    },

    // Handle extend menu mouse enter
    onExtendMenuMouseEnter() {
      this.extendMenuMouseIn = true;
      if (this.extendMenuHideTimer) {
        clearTimeout(this.extendMenuHideTimer);
        this.extendMenuHideTimer = null;
      }
    },

    // Handle extend menu mouse leave
    onExtendMenuMouseLeave() {
      this.extendMenuMouseIn = false;
      this._hideExtendMenuDelayed();
    },

    // Create a virtual tag object for category terms that can work with existing weight methods
    _createVirtualCategoryTermTag() {
      if (!this.categoryTermHoverData) return null;

      const { tag, termValue, termIndex } = this.categoryTermHoverData;

      // Create a virtual tag that represents the individual term
      const virtualTag = {
        id: `category-term-${tag.id}-${termIndex}`,
        value: termValue,
        weightNum: this._getCategoryTermWeight(termValue),
        incWeight: 0,
        decWeight: 0,
        isLora: false,
        isLyco: false,
        isEmbedding: false,
        isCategoryTerm: true,
        parentTag: tag,
        termIndex: termIndex,
      };

      // Set tag class properties for the virtual tag
      this._setTagClass(virtualTag);

      return virtualTag;
    },

    // Get weight of a category term
    _getCategoryTermWeight(termValue) {
      // Extract weight from various weight syntaxes
      // Check for colon syntax first: (term:1.2), [term:0.8], {term:1.5}
      const colonWeightMatch = termValue.match(
        /^[\(\[\{](.+):(\-?[0-9\.]+)[\)\]\}]$/
      );
      if (colonWeightMatch) {
        return parseFloat(colonWeightMatch[2]);
      }

      // Check for bracket/parentheses layers
      const weightNum = common.getTagWeightNum(termValue);
      return weightNum || 1.0;
    },

    // Modify individual term within a category declaration
    _modifyCategoryTerm(tag, termIndex, originalTermValue, action, value) {
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = tag.value.match(categoryRegex);

      if (!match) return;

      const [, categoryName, termsStr] = match;
      const terms = termsStr.split(",").map((term) => term.trim());

      if (termIndex >= terms.length) return;

      let modifiedTerm = terms[termIndex];

      // Detect term type to preserve syntax highlighting
      const isLoRA =
        modifiedTerm.match(common.loraRegex) ||
        modifiedTerm.match(common.lycoRegex);
      const isEmbedding =
        !isLoRA &&
        this.embeddingExists &&
        this.embeddingExists(this._extractBaseTerm(modifiedTerm)) !== false;

      // Apply weight modification based on action
      switch (action) {
        case "inc":
          // For LoRA terms, use their internal weight syntax
          if (isLoRA) {
            modifiedTerm = this._modifyLoRAWeight(modifiedTerm, "inc", value);
          } else {
            // For embeddings and regular terms, use standard weight syntax
            if (this.useNovelAiWeightSymbol) {
              modifiedTerm = common.setLayers(modifiedTerm, value, "{", "}");
            } else {
              modifiedTerm = common.setLayers(modifiedTerm, value, "(", ")");
            }
          }
          break;

        case "dec":
          // For LoRA terms, use their internal weight syntax
          if (isLoRA) {
            modifiedTerm = this._modifyLoRAWeight(modifiedTerm, "dec", value);
          } else {
            // For embeddings and regular terms, use standard weight syntax
            modifiedTerm = common.setLayers(modifiedTerm, value, "[", "]");
          }
          break;

        case "set":
          // For LoRA terms, modify their internal weight
          if (isLoRA) {
            modifiedTerm = this._modifyLoRAWeight(modifiedTerm, "set", value);
          } else {
            // For embeddings and regular terms, use standard colon syntax
            // Remove existing weight syntax first
            modifiedTerm = this._removeWeightSyntax(modifiedTerm);

            if (value !== 1.0 && value !== 1) {
              // Apply new weight with colon syntax
              if (this.useNovelAiWeightSymbol) {
                modifiedTerm = `{${modifiedTerm}:${value}}`;
              } else {
                modifiedTerm = `(${modifiedTerm}:${value})`;
              }
            }
          }
          break;
      }

      // Update the term in the array
      terms[termIndex] = modifiedTerm;

      // Reconstruct the category declaration
      const newValue = `{${categoryName}: ${terms.join(", ")}}`;

      // Update the tag
      tag.value = newValue;
      this._setTag(tag);
      this.updateTags();

      // Update hover data with new term value
      this.categoryTermHoverData.termValue = modifiedTerm;

      // Critical fix: Store the modified term value persistently
      this._storeModifiedTermValue(tag.id, termIndex, modifiedTerm);

      // Force re-render to ensure syntax highlighting is updated
      this.$nextTick(() => {
        // Critical fix: Explicitly update DOM attribute for the modified term
        // This ensures the data-term-value attribute reflects the new weight
        this._syncCategoryTermAttribute(tag.id, termIndex, modifiedTerm);

        // Force custom colors to be applied if available
        if (this._applyCustomColorsToTags) {
          this._applyCustomColorsToTags();
        }

        // Re-setup listeners after DOM update
        this._setupCategoryTermHoverListeners();
      });
    },

    // Delete individual term from a category declaration
    _deleteCategoryTerm(tag, termIndex) {
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = tag.value.match(categoryRegex);

      if (!match) return;

      const [, categoryName, termsStr] = match;
      const terms = termsStr.split(",").map((term) => term.trim());

      if (termIndex >= terms.length) return;

      // Remove the term at the specified index
      terms.splice(termIndex, 1);

      // Clear the stored modified value for the deleted term
      this._clearStoredModifiedTermValue(tag.id, termIndex);

      // Shift down stored values for terms after the deleted one
      this._shiftStoredModifiedTermValues(tag.id, termIndex, terms.length + 1);

      // If no terms left, delete the entire tag
      if (terms.length === 0) {
        this._clearAllStoredModifiedTermValues(tag.id);
        const tagIndex = this.tags.indexOf(tag);
        this.tags.splice(tagIndex, 1);
        this.showExtendId = "";
        this.categoryTermHoverData = null;
        this.updateTags();
        return;
      }

      // Reconstruct the category declaration with proper formatting
      const newValue = `{${categoryName}: ${terms.join(", ")}}`;

      // Update the tag
      tag.value = newValue;
      this._setTag(tag);
      this.updateTags();

      // Clear hover data since the term no longer exists
      this.showExtendId = "";
      this.categoryTermHoverData = null;
    },

    // Disable/enable individual term within a category declaration
    _disableCategoryTerm(tag, termIndex, termValue) {
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = tag.value.match(categoryRegex);

      if (!match) return;

      const [, categoryName, termsStr] = match;
      const terms = termsStr.split(",").map((term) => term.trim());

      if (termIndex >= terms.length) return;

      let modifiedTerm = terms[termIndex];

      // Check if the term is currently disabled (wrapped in [])
      const isDisabled =
        modifiedTerm.startsWith("[") && modifiedTerm.endsWith("]");

      if (isDisabled) {
        // Enable the term by removing the brackets
        modifiedTerm = modifiedTerm.slice(1, -1);
      } else {
        // Disable the term by wrapping it in brackets
        modifiedTerm = `[${modifiedTerm}]`;
      }

      // Update the term in the array
      terms[termIndex] = modifiedTerm;

      // Reconstruct the category declaration
      const newValue = `{${categoryName}: ${terms.join(", ")}}`;

      // Update the tag
      tag.value = newValue;
      this._setTag(tag);
      this.updateTags();

      // Update hover data with new term value
      this.categoryTermHoverData.termValue = modifiedTerm;

      // Store the modified term value persistently
      this._storeModifiedTermValue(tag.id, termIndex, modifiedTerm);

      // Synchronize DOM attribute with modified term value
      this._syncCategoryTermAttribute(tag.id, termIndex, modifiedTerm);
    },

    // Helper function to extract base term from weighted syntax
    _extractBaseTerm(term) {
      // Remove weight brackets and colon syntax
      let baseTerm = term;

      // CRITICAL FIX: Don't process LoRA/LyCO syntax as it has internal colons
      // LoRA syntax like <lora:name:1.2> should not be treated as weight syntax
      if (baseTerm.match(/^<(lora|lyco):[^>]+>$/)) {
        return baseTerm; // Return LoRA terms unchanged
      }

      // Remove outer weight brackets: (term), [term], {term}
      baseTerm = baseTerm.replace(/^[\(\[\{](.+)[\)\]\}]$/, "$1");

      // Remove colon weight syntax: term:1.2 (but not for LoRA terms)
      baseTerm = baseTerm.replace(/^(.+):\-?[0-9\.]+$/, "$1");

      return baseTerm.trim();
    },

    // Helper function to remove weight syntax while preserving term type
    _removeWeightSyntax(term) {
      let cleanTerm = term;

      // CRITICAL FIX: Don't process LoRA/LyCO syntax as it has internal colons
      // LoRA syntax like <lora:name:1.2> should not be treated as weight syntax
      if (cleanTerm.match(/^<(lora|lyco):[^>]+>$/)) {
        return cleanTerm; // Return LoRA terms unchanged
      }

      // Remove outer weight brackets: (term), [term], {term}
      cleanTerm = cleanTerm.replace(/^[\(\[\{](.+)[\)\]\}]$/, "$1");

      // Remove colon weight syntax: term:1.2 (but not for LoRA terms)
      cleanTerm = cleanTerm.replace(/^(.+):\-?[0-9\.]+$/, "$1");

      return cleanTerm.trim();
    },

    // Helper function to unescape HTML entities
    // CRITICAL FIX: Use string-based approach instead of DOM manipulation
    // This prevents the creation of 83+ DOM elements during hover events
    _unescapeHtml(str) {
      if (!str) return str;

      // Use the common utility method that doesn't create DOM elements
      return common.unescapeHtml(str);
    },

    // Helper function to get the current tag ID during rendering
    // This is used to look up stored modified term values during DOM re-rendering
    _getCurrentTagId(categoryValue) {
      // Find the tag that matches this category value
      const tag = this.tags.find((t) => t.value === categoryValue);
      return tag ? tag.id : null;
    },

    // Critical fix: Store modified term values persistently
    // This prevents LoRA weight loss by maintaining modified values across hover events
    _storeModifiedTermValue(tagId, termIndex, termValue) {
      const key = `${tagId}-${termIndex}`;
      this.modifiedTermValues.set(key, termValue);
    },

    // Get stored modified term value
    _getStoredModifiedTermValue(tagId, termIndex) {
      const key = `${tagId}-${termIndex}`;
      return this.modifiedTermValues.get(key);
    },

    // Clear stored modified term value (when tag is deleted or reset)
    _clearStoredModifiedTermValue(tagId, termIndex) {
      if (!this.modifiedTermValues) {
        return;
      }

      const key = `${tagId}-${termIndex}`;
      this.modifiedTermValues.delete(key);
    },

    // Clear all stored modified term values for a specific tag
    _clearAllStoredModifiedTermValues(tagId) {
      // Find and delete all keys that start with this tagId
      const keysToDelete = [];
      for (const key of this.modifiedTermValues.keys()) {
        if (key.startsWith(`${tagId}-`)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => {
        this.modifiedTermValues.delete(key);
      });
    },

    // Shift stored modified term values when a term is deleted
    _shiftStoredModifiedTermValues(tagId, deletedIndex, originalLength) {
      if (!this.modifiedTermValues) {
        return;
      }

      // Create a temporary map to store shifted values
      const shiftedValues = new Map();

      // Find all keys for this tag and shift indices down
      for (const [key, value] of this.modifiedTermValues.entries()) {
        if (key.startsWith(`${tagId}-`)) {
          const termIndex = parseInt(key.split("-")[1]);

          if (termIndex > deletedIndex) {
            // Shift this index down by 1
            const newKey = `${tagId}-${termIndex - 1}`;
            shiftedValues.set(newKey, value);
            this.modifiedTermValues.delete(key);
          }
        }
      }

      // Add the shifted values back
      for (const [key, value] of shiftedValues.entries()) {
        this.modifiedTermValues.set(key, value);
      }
    },

    // Critical fix: Synchronize DOM attribute with modified term value
    // This prevents LoRA weight loss during hover events after modifications
    _syncCategoryTermAttribute(tagId, termIndex, newTermValue) {
      // Find the tag element in the DOM
      const tagElement = this.$el.querySelector(`[data-id="${tagId}"]`);
      if (!tagElement) return;

      // Find the specific term wrapper within the tag
      const termWrapper = tagElement.querySelector(
        `.category-term-wrapper[data-term-index="${termIndex}"]`
      );
      if (!termWrapper) return;

      // Update the data-term-value attribute with the new value
      // This is critical for LoRA terms to prevent weight loss on subsequent hovers
      termWrapper.setAttribute(
        "data-term-value",
        common.escapeHtml(newTermValue)
      );

      // Also update the hover data if it matches this term to maintain consistency
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === tagId &&
        this.categoryTermHoverData.termIndex === termIndex
      ) {
        this.categoryTermHoverData.termValue = newTermValue;
      }
    },

    // Helper function to modify LoRA weight syntax properly
    _modifyLoRAWeight(loraTerm, action, value) {
      // Parse LoRA syntax: <lora:name:weight> or <lyco:name:weight>
      const loraMatch = loraTerm.match(/^<(lora|lyco):([^:>]+)(?::([^>]+))?>$/);

      if (!loraMatch) {
        // If it's not a proper LoRA format, treat as regular term
        return loraTerm;
      }

      const [, type, name, currentWeight] = loraMatch;
      let newWeight = currentWeight ? parseFloat(currentWeight) : 1.0;

      switch (action) {
        case "inc":
          newWeight += value || 0.1;
          break;
        case "dec":
          newWeight -= value || 0.1;
          newWeight = Math.max(0.1, newWeight); // Prevent negative weights
          break;
        case "set":
          newWeight = value;
          break;
      }

      // Round to 1 decimal place
      newWeight = Math.round(newWeight * 10) / 10;

      // Reconstruct LoRA syntax
      if (newWeight === 1.0) {
        // If weight is 1.0, we can omit it for cleaner syntax
        return `<${type}:${name}>`;
      } else {
        return `<${type}:${name}:${newWeight}>`;
      }
    },
  },
};
