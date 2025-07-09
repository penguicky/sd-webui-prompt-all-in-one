import common from "@/utils/common";
import autoSizeInput from "autosize-input";

export default {
  data() {
    return {
      tagClickTimeId: 0,
      showExtendId: "",
    };
  },
  mounted() {
    /*common.gradioApp().addEventListener('mousemove', () => {
            this.$refs.highlightPrompt.hide()
        })*/
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
        let result = `<span class="lora-punctuation">&lt;</span><span class="lora-punctuation">${type}</span><span class="lora-punctuation">:</span><span class="character">${common.escapeHtml(
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
        // First try to highlight LoRA syntax
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
  },
};
