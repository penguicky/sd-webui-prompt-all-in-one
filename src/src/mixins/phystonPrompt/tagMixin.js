import common from "@/utils/common";
import autoSizeInput from "autosize-input";

export default {
  data() {
    return {
      tagClickTimeId: 0,
      showExtendId: "",
      categoryTermHoverData: null, // Store data about the hovered category term
    };
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
      let maxNum = 10;
      let interval = setInterval(() => {
        // console.log(maxNum, tag)
        maxNum--;
        if (maxNum <= 0) clearInterval(interval);
        if (!this.$refs["promptTagValue-" + tag.id]) return false;
        if (!this.$refs["promptTagValue-" + tag.id][0]) return false;
        clearInterval(interval);
        let $tag = this.$refs["promptTagValue-" + tag.id][0];
        let height = $tag.offsetHeight;
        $tag.parentNode.style.height = height + "px";
        if (this.$refs["promptTagEdit-" + tag.id]) {
          this.$refs["promptTagEdit-" + tag.id][0].style.height = height + "px";
        }
        if (this.$refs["promptTagDelete-" + tag.id]) {
          this.$refs["promptTagDelete-" + tag.id][0].style.height =
            height + "px";
        }
      }, 50);
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
    _setTagById(id, value = null, localValue = null) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      if (value !== null) tag.value = value;
      if (localValue !== null) tag.localValue = localValue;
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
      localValue = "",
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
        localValue:
          localValue === null ||
          localValue === undefined ||
          localValue === false
            ? ""
            : localValue,
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
      this.$nextTick(() => {
        if (this.$refs["promptTagEdit-" + id])
          autoSizeInput(this.$refs["promptTagEdit-" + id][0]);
      });
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
        const termClass = isEmbedding ? "embedding-tag" : "character";

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
          const term = terms[i];

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

          // Check if it's an embedding
          if (this.embeddingExists(term) !== false) {
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
        this.autoTranslateByIndexes(indexes);
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
      if (this.hotkey.hover === "extend") this.showExtendId = "";
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
        this.updateTags();
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
      let localValue = tag.localValue;
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
            if (localValue !== "")
              localValue = common.setLayers(
                localValue,
                0,
                bracket[0],
                bracket[1]
              );
          } else {
            // 不移除括号
          }
          // 移除权重数
          value = value.replace(common.weightNumRegex, "$1");
          if (localValue !== "")
            localValue = localValue.replace(common.weightNumRegex, "$1");
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
              if (localValue !== "")
                localValue = common.setLayers(
                  localValue,
                  1,
                  bracket[0],
                  bracket[1],
                  ":" + weightNum
                );
            } else {
              value = value + ":" + weightNum;
              if (localValue !== "") localValue = localValue + ":" + weightNum;
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
              if (localValue !== "")
                localValue = common.setLayers(localValue, 1, "{", "}");
            } else {
              value = common.setLayers(value, 1, "(", ")");
              if (localValue !== "")
                localValue = common.setLayers(localValue, 1, "(", ")");
            }
          }
        }
        if (value !== tag.value) {
          tag.value = value;
          if (localValue !== "") tag.localValue = localValue;
          this._setTag(tag);
        }
      } else {
        if (this.autoKeepWeightZero) {
          // 保留权重数
          tag.value = value.replace(common.weightNumRegex, "$1:0");
          if (localValue !== "")
            tag.localValue = tag.localValue.replace(
              common.weightNumRegex,
              "$1:0"
            );
        } else {
          // 移除权重数
          tag.value = value.replace(common.weightNumRegex, "$1");
          if (localValue !== "")
            tag.localValue = tag.localValue.replace(
              common.weightNumRegex,
              "$1"
            );
        }
      }
      tag.weightNum = weightNum;
      this.updateTags();
    },
    onDeleteTagClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return false;
      let index = this.tags.indexOf(tag);
      this.tags.splice(index, 1);
      this.updateTags();
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
            tag.localValue === "" ? tag.value : tag.localValue
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
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      tag.disabled = !tag.disabled;
      this.updateTags();
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
      let localValue = tag.localValue;
      value = common.setLayers(value, 0, "[", "]");
      if (localValue !== "")
        localValue = common.setLayers(localValue, 0, "[", "]");
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, 0, "(", ")");
        if (localValue !== "")
          localValue = common.setLayers(localValue, 0, "(", ")");
      }
      let incWeight = tag.incWeight;
      incWeight += num;
      if (incWeight < 0) incWeight = 0;
      tag.incWeight = incWeight;
      tag.decWeight = 0;
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, incWeight, "{", "}");
        if (localValue !== "")
          localValue = common.setLayers(localValue, incWeight, "{", "}");
      } else {
        value = common.setLayers(value, incWeight, "(", ")");
        if (localValue !== "")
          localValue = common.setLayers(localValue, incWeight, "(", ")");
      }
      tag.value = value;
      if (localValue !== "") tag.localValue = localValue;
      this.updateTags();
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
      let localValue = tag.localValue;
      value = common.setLayers(value, 0, "(", ")");
      if (localValue !== "")
        localValue = common.setLayers(localValue, 0, "(", ")");
      if (this.useNovelAiWeightSymbol) {
        value = common.setLayers(value, 0, "{", "}");
        if (localValue !== "")
          localValue = common.setLayers(localValue, 0, "{", "}");
      }
      let decWeight = tag.decWeight;
      decWeight += num;
      if (decWeight < 0) decWeight = 0;
      tag.incWeight = 0;
      tag.decWeight = decWeight;
      value = common.setLayers(value, decWeight, "[", "]");
      if (localValue !== "")
        localValue = common.setLayers(localValue, decWeight, "[", "]");
      tag.value = value;
      if (localValue !== "") tag.localValue = localValue;
      this.updateTags();
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
    onTranslateToLocalClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      let index = this.tags.indexOf(tag);
      if (this.loading[tag.id + "_local"]) return;
      this.translates([index], true, true).finally(() => {
        this.updateTags();
      });
    },
    onTranslateToEnglishClick(id) {
      let tag = this.tags.find((tag) => tag.id === id);
      if (!tag) return;
      let index = this.tags.indexOf(tag);
      if (this.loading[tag.id + "_en"]) return;
      this.translates([index], false, true).finally(() => {
        this.updateTags();
      });
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

    /**
     * Handle mouse enter event on individual category term wrapper
     *
     * This method enables interaction with individual terms within category declarations
     * like {category: term1, term2, term3}. When a user hovers over a specific term,
     * it captures the term data, calculates positioning, and shows the weight control menu.
     *
     * Key Features:
     * - Detects hover over individual terms within categories
     * - Calculates precise positioning for dynamic menu placement
     * - Integrates with existing btn-tag-extend menu system
     * - Preserves category structure during term modifications
     *
     * @param {MouseEvent} event - The mouse enter event from category term wrapper
     */
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

        // Store category term hover data with position information
        this.categoryTermHoverData = {
          tagId: tagId,
          tag: tag,
          termId: termId,
          termValue: termValue,
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

    /**
     * Handle mouse leave event on individual category term wrapper
     *
     * This method cleans up the category term hover state when the user moves
     * the mouse away from an individual term. It ensures proper cleanup of
     * hover data and menu state.
     *
     * @param {MouseEvent} event - The mouse leave event from category term wrapper
     */
    _onCategoryTermMouseLeave(event) {
      const target = event.target;
      const termWrapper = target.closest(".category-term-wrapper");

      if (termWrapper && this.categoryTermHoverData) {
        const termId = termWrapper.getAttribute("data-term-id");

        if (this.categoryTermHoverData.termId === termId) {
          this.showExtendId = "";
          this.categoryTermHoverData = null;
        }

        // Prevent the normal tag hover from triggering
        event.stopPropagation();
      }
    },

    // Create a virtual tag object for category terms that can work with existing weight methods
    _createVirtualCategoryTermTag() {
      if (!this.categoryTermHoverData) return null;

      const { tag, termValue, termIndex } = this.categoryTermHoverData;

      // Create a virtual tag that represents the individual term
      const virtualTag = {
        id: `category-term-${tag.id}-${termIndex}`,
        value: termValue,
        localValue: "",
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

    /**
     * Helper function to modify LoRA weight values
     *
     * @param {string} loraTag - The LoRA tag to modify (e.g., "<lora:name:1.0>")
     * @param {string} action - Type of modification: "inc", "dec", or "set"
     * @param {number} value - Weight value or increment/decrement amount
     * @returns {string} Modified LoRA tag
     */
    _modifyLoraWeight(loraTag, action, value) {
      // Match LoRA syntax: <lora:name:weight> or <lyco:name:weight>
      const loraRegex = /^<(lora|lyco):([^:>]+):([^>]+)>/;
      const match = loraTag.match(loraRegex);

      if (!match) return loraTag; // Not a LoRA tag, return unchanged

      const [, type, name, strengthStr] = match;

      // Extract the numeric weight from the strength string
      const weightMatch = strengthStr.match(/^(\-?[0-9\.]+)/);
      if (!weightMatch) return loraTag; // No valid weight found

      let currentWeight = parseFloat(weightMatch[1]);
      let newWeight = currentWeight;

      // Apply weight modification based on action
      switch (action) {
        case "inc":
          newWeight = currentWeight + value * 0.1; // Increment by 0.1 * value
          break;
        case "dec":
          newWeight = currentWeight - value * 0.1; // Decrement by 0.1 * value
          break;
        case "set":
          newWeight = value; // Set to specific value
          break;
      }

      // Ensure weight doesn't go below 0
      newWeight = Math.max(0, newWeight);

      // Round to 1 decimal place to avoid floating point precision issues
      newWeight = Math.round(newWeight * 10) / 10;

      // Replace the weight in the original strength string
      const newStrengthStr = strengthStr.replace(
        /^(\-?[0-9\.]+)/,
        newWeight.toString()
      );

      return `<${type}:${name}:${newStrengthStr}>`;
    },

    /**
     * Modify individual term within a category declaration while preserving structure
     *
     * This method handles weight modifications for individual terms within category
     * declarations like {category: term1, term2, term3}. It parses the category,
     * modifies the specific term, and reconstructs the category while maintaining
     * the overall structure and other terms.
     *
     * Supported Actions:
     * - "inc": Increase weight using parentheses (term) or {term} for NovelAI
     * - "dec": Decrease weight using brackets [term]
     * - "set": Set specific weight using colon syntax (term:1.2)
     * - For LoRA tags: Modifies internal weight parameter directly
     *
     * @param {Object} tag - The parent category tag object
     * @param {number} termIndex - Index of the term within the category
     * @param {string} originalTermValue - Original value of the term being modified
     * @param {string} action - Type of modification: "inc", "dec", or "set"
     * @param {number} value - Weight value or increment/decrement amount
     */
    _modifyCategoryTerm(tag, termIndex, originalTermValue, action, value) {
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = tag.value.match(categoryRegex);

      if (!match) return;

      const [, categoryName, termsStr] = match;
      const terms = termsStr.split(",").map((term) => term.trim());

      if (termIndex >= terms.length) return;

      let modifiedTerm = terms[termIndex];

      // Check if this is a LoRA or LyCO tag
      const isLoraTag =
        common.loraRegex.test(modifiedTerm) ||
        common.lycoRegex.test(modifiedTerm);

      if (isLoraTag) {
        // For LoRA tags, modify the internal weight parameter
        modifiedTerm = this._modifyLoraWeight(modifiedTerm, action, value);
      } else {
        // For regular terms, apply standard weight syntax
        switch (action) {
          case "inc":
            // Add parentheses for emphasis
            if (this.useNovelAiWeightSymbol) {
              modifiedTerm = common.setLayers(modifiedTerm, value, "{", "}");
            } else {
              modifiedTerm = common.setLayers(modifiedTerm, value, "(", ")");
            }
            break;

          case "dec":
            // Add brackets for de-emphasis
            modifiedTerm = common.setLayers(modifiedTerm, value, "[", "]");
            break;

          case "set":
            // Set specific weight using colon syntax
            // Remove existing weight syntax first
            modifiedTerm = modifiedTerm.replace(/^[\(\[\{](.+)[\)\]\}]$/, "$1");
            modifiedTerm = modifiedTerm.replace(/^(.+):\-?[0-9\.]+$/, "$1");

            if (value !== 1.0 && value !== 1) {
              // Apply new weight with colon syntax
              if (this.useNovelAiWeightSymbol) {
                modifiedTerm = `{${modifiedTerm}:${value}}`;
              } else {
                modifiedTerm = `(${modifiedTerm}:${value})`;
              }
            }
            break;
        }
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

      // Re-setup listeners after DOM update
      this.$nextTick(() => {
        this._setupCategoryTermHoverListeners();
      });
    },
  },
};
