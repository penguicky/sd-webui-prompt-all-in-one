<template>
  <div class="physton-prompt" :name="name">
    <div
      :class="['prompt-main', hidePanel ? 'fold' : '']"
      @click="onPromptMainClick"
    >
      <div class="prompt-header">
        <div
          class="prompt-unfold"
          @click="onUnfoldClick"
          v-tooltip="getLang(hidePanel ? 'show_panel' : 'hide_panel')"
        >
          <icon-svg class="hover-scale-120" name="unfold" />
        </div>
        <div class="prompt-header-title">
          {{ neg ? getLang("negative_prompt") : getLang("prompt") }}
        </div>
        <div class="prompt-header-counter" v-show="counterText">
          ({{ counterText }})
        </div>
        <div class="prompt-header-extend">
          <div class="extend-content">
            <div class="extend-btn-group">
              <div
                class="extend-btn-item"
                v-tooltip="'Language: ' + langName"
                @click="$emit('click:selectLanguage', $event)"
              >
                <icon-svg class="hover-scale-120" name="i18n" />
              </div>
              <div
                :class="['extend-btn-item', isLatestVersion ? '' : 'red-dot']"
              >
                <icon-svg
                  class="hover-scale-120"
                  name="setting"
                  v-tooltip="getLang('setting_desc')"
                />
                <div
                  class="setting-box"
                  v-animate="'fadeIn'"
                  @mouseenter="onSettingBoxMouseEnter"
                >

                  <div
                    class="extend-btn-item"
                    v-tooltip="getLang('prompt_format')"
                    @click="$emit('click:promptFormat', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="format" />
                  </div>
                  <div
                    class="extend-btn-item"
                    v-tooltip="getLang('keywords_blacklist')"
                    @click="$emit('click:blacklist', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="blacklist" />
                  </div>
                  <div
                    class="extend-btn-item"
                    v-tooltip="getLang('hotkey_setting')"
                    @click="$emit('click:hotkey', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="hotkey" />
                  </div>
                  <div
                    class="extend-btn-item"
                    v-tooltip="
                      getLang('syntax_highlighting_settings') ||
                      'Syntax Highlighting Settings'
                    "
                    @click="$emit('click:syntaxHighlightingSettings', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="format" />
                  </div>
                  <div
                    class="extend-btn-item"
                    v-tooltip="getLang('theme_extension')"
                    @click="$emit('click:selectTheme', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="theme" />
                  </div>
                  <div
                    class="extend-btn-item"
                    v-tooltip="
                      getLang(
                        theme === 'dark'
                          ? 'switch_to_light_theme'
                          : 'switch_to_dark_theme'
                      )
                    "
                    @click="$emit('click:switchTheme', $event)"
                  >
                    <icon-svg
                      class="hover-scale-120"
                      :name="theme === 'dark' ? 'sun' : 'moon'"
                    />
                  </div>
                  <div
                    :class="[
                      'extend-btn-item',
                      isLatestVersion ? '' : 'red-dot',
                    ]"
                    v-tooltip="getLang('about_desc')"
                    @click="$emit('click:showAbout', $event)"
                  >
                    <icon-svg class="hover-scale-120" name="about" />
                  </div>

                  <!--<div class="gradio-checkbox hover-scale-120">
                                        <label v-tooltip="getLang('is_remove_space')">
                                            <input type="checkbox" name="auto_remove_space" value="1"
                                                   :checked="autoRemoveSpace"
                                                   @change="$emit('update:autoRemoveSpace', $event.target.checked)">
                                            <icon-svg name="remove-space"/>
                                        </label>
                                    </div>-->
                  <div class="gradio-checkbox hover-scale-120">
                    <label v-tooltip="getLang('whether_to_enable_tooltip')">
                      <input
                        type="checkbox"
                        name="enable_tooltip"
                        value="1"
                        :checked="enableTooltip"
                        @change="
                          $emit('update:enableTooltip', $event.target.checked)
                        "
                      />
                      <icon-svg name="tooltip" />
                    </label>
                  </div>
                  <div class="gradio-checkbox hover-scale-120">
                    <label
                      v-tooltip="getLang('enable_native_highlighting_tooltip')"
                    >
                      <input
                        type="checkbox"
                        name="enable_native_highlighting"
                        value="1"
                        :checked="enableNativeHighlighting"
                        @change="
                          $emit(
                            'update:enableNativeHighlighting',
                            $event.target.checked
                          )
                        "
                      />
                      <icon-svg name="theme" />
                    </label>
                  </div>
                  <div class="gradio-checkbox">
                    <label v-tooltip="getLang('auto_input_prompt')">
                      <select
                        v-model="autoInputPrompt"
                        @change="onAutoInputPromptChange"
                      >
                        <option value="disabled">
                          {{ getLang("auto_input_prompt") }}:
                          {{ getLang("disabled") }}
                        </option>
                        <option value="last">
                          {{ getLang("last_input_prompt") }}
                        </option>
                        <optgroup
                          v-for="item in getCurrentTypeFavorites()"
                          :key="item.key"
                          :label="
                            getLang('favorite') + ' / ' + getLang(item.name)
                          "
                        >
                          <option
                            v-for="favorite in item.list"
                            :value="favorite.id"
                          >
                            {{
                              favorite.name || favorite.prompt.substring(0, 40)
                            }}
                          </option>
                        </optgroup>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!--<div class="prompt-header-break"></div>-->
        <div class="prompt-header-extend">
          <div class="extend-content">
            <div class="extend-btn-group">
              <div
                class="extend-btn-item"
                ref="historyButton"
                v-tooltip="getLang('history')"
                @click="$emit('click:showHistory', $event)"
              >
                <icon-svg class="hover-scale-120" name="history" />
              </div>
              <div
                class="extend-btn-item"
                ref="favoriteButton"
                v-tooltip="getLang('favorite')"
                @click="$emit('click:showFavorite', $event)"
              >
                <icon-svg class="hover-scale-120" name="favorite" />
              </div>
            </div>
          </div>
        </div>

        <div class="prompt-header-extend">
          <div class="extend-content">
            <div class="extend-btn-group">
              <div
                class="extend-btn-item"
                v-tooltip="getLang('copy_keywords_to_clipboard')"
                @click="onCopyAllTagsClick"
              >
                <icon-svg class="hover-scale-120" name="copy" />
              </div>
              <div
                class="extend-btn-item"
                v-tooltip="getLang('delete_all_keywords')"
                @click="onDeleteAllTagsClick"
              >
                <icon-svg class="hover-scale-120" name="remove" />
              </div>
            </div>
          </div>
        </div>
        <div class="prompt-header-extend" v-if="!autoLoadWebuiPrompt">
          <div class="extend-content">
            <div class="extend-btn-group">
              <div
                class="extend-btn-item"
                v-tooltip="getLang('load_webui_prompt')"
                @click="onClickLoadWebuiPrompt"
              >
                <icon-svg class="hover-scale-120" name="load2" />
              </div>
            </div>
          </div>
        </div>

        <div class="prompt-header-extend prompt-append">
          <div class="extend-content">
            <div class="gradio-checkbox hover-scale-120">
              <label v-tooltip="getLang('auto_load_webui_prompt')">
                <input
                  type="checkbox"
                  name="auto_load_webui_prompt"
                  value="1"
                  :checked="autoLoadWebuiPrompt"
                  @change="
                    $emit('update:autoLoadWebuiPrompt', $event.target.checked)
                  "
                />
                <icon-svg name="load" />
              </label>
            </div>
            <div class="gradio-checkbox hover-scale-120">
              <label
                v-if="hideDefaultInput"
                v-tooltip="getLang('show_default_input_box')"
              >
                <input
                  type="checkbox"
                  name="hide_default_input"
                  value="1"
                  :checked="!hideDefaultInput"
                  @change="
                    $emit('update:hideDefaultInput', !$event.target.checked)
                  "
                />
                <icon-svg name="input" />
              </label>
              <label v-else v-tooltip="getLang('hide_default_input_box')">
                <input
                  type="checkbox"
                  name="hide_default_input"
                  value="1"
                  :checked="!hideDefaultInput"
                  @change="
                    $emit('update:hideDefaultInput', !$event.target.checked)
                  "
                />
                <icon-svg name="input" />
              </label>
            </div>
            <textarea
              type="text"
              class="scroll-hide svelte-4xt1ch input-tag-append"
              ref="promptTagAppend"
              :placeholder="getLang('please_enter_new_keyword')"
              v-tooltip="getLang('enter_to_add')"
              @focus="onAppendTagFocus"
              @blur="onAppendTagBlur"
              @keyup="onAppendTagKeyUp"
              @keydown="onAppendTagKeyDown"
            ></textarea>

            <div
              class="prompt-append-list"
              ref="promptAppendList"
              v-show="showAppendList"
              :style="appendListStyle"
            >
              <div
                v-for="(item, index) in appendList"
                :key="item.type"
                :class="[
                  'prompt-append-group',
                  appendListSelected === index ? 'selected' : '',
                ]"
              >
                <div
                  class="append-group-name"
                  @click="onAppendGroupClick(index, null, $event)"
                >
                  <icon-svg
                    class="name-icon"
                    v-if="item.icon === 'wrap'"
                    name="wrap"
                  />
                  <icon-svg
                    class="name-icon"
                    v-else-if="item.icon === 'history'"
                    name="history"
                  />
                  <icon-svg
                    class="name-icon"
                    v-else-if="item.icon === 'favorite'"
                    name="favorite"
                  />
                  {{ appendListItemName(item) }}
                  <span
                    class="arrow-right"
                    v-show="item.children.length > 0"
                  ></span>
                </div>
                <Transition name="fade">
                  <div
                    class="append-group-list"
                    ref="promptAppendListChildren"
                    v-show="item.children.length > 0"
                  >
                    <div
                      v-for="(child, childIndex) in item.children"
                      :key="childIndex"
                      ref="promptAppendListChild"
                      :class="[
                        'append-item',
                        appendListChildSelected === childIndex
                          ? 'selected'
                          : '',
                      ]"
                      @mouseleave="
                        onAppendListChildMouseLeave(index, childIndex, $event)
                      "
                      @mouseenter="
                        onAppendListChildMouseEnter(index, childIndex, $event)
                      "
                      @click="onAppendGroupClick(index, childIndex, $event)"
                    >
                      <template
                        v-if="
                          item.type === 'favorite' || item.type === 'history'
                        "
                      >
                        <div class="tags-name" v-if="child.name">
                          {{ child.name }}
                        </div>
                        <div class="tags-name" v-else>{{ child.prompt }}</div>
                      </template>
                    </div>
                  </div>
                </Transition>
                <Transition name="fade">
                  <div
                    class="tags-detail"
                    v-show="
                      appendListSelected !== null &&
                      appendListChildSelected !== null &&
                      appendListSelected === index &&
                      (item.type === 'favorite' || item.type === 'history')
                    "
                  >
                    <div class="tags-list">
                      <template
                        v-for="(tag, tagIndex) in appendListChildItemTags"
                        :key="tagIndex"
                      >
                        <div
                          v-if="tag.type && tag.type === 'wrap'"
                          class="item-wrap"
                        ></div>
                        <div v-else class="tags-item">
                          <div class="item-tag-value">{{ tag.value }}</div>
                          <div class="item-tag-local-value">
                            {{ tag.localValue }}
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        :class="[
          'prompt-tags',
          droping ? 'droping' : '',
          dropIsSelecting || (dropIsEnd && dropTags.length) ? 'selecting' : '',
        ]"
        ref="promptTags"
        @mousedown="onDropMouseDown"
        @mousemove="onDropMouseMove"
        @mouseup="onDropMouseUp"
      >
        <div class="prompt-tags-list" ref="promptTagsList">
          <!--<TransitionGroup name="fadeLeft">-->
          <div
            v-for="(tag, index) in tags"
            :key="tag.id + '-' + colorRefreshKey"
            :class="[
              'prompt-tag',
              tag.disabled ? 'disabled' : '',
              tag.type === 'wrap' ? 'wrap-tag' : '',
            ]"
            :ref="'promptTag-' + tag.id"
            :data-id="tag.id"
          >
            <div
              class="prompt-tag-main"
              @mouseenter="onTagMouseEnter(tag.id)"
              @mousemove.stop="onTagMouseMove(tag.id)"
              @mouseleave.stop="onTagMouseLeave(tag.id)"
            >
              <div class="prompt-tag-edit">
                <template v-if="tag.type === 'wrap'">
                  <div
                    class="prompt-tag-value"
                    :ref="'promptTagValue-' + tag.id"
                    v-tooltip="
                      getLang('line_break_character') +
                      '<br/>' +
                      getLang('drop_to_order')
                    "
                    style="width: 100%"
                  >
                    <icon-svg name="wrap" />
                  </div>
                </template>
                <!--<template v-else-if="tag.type === 'favorite'">
                                </template>
                                <template v-else-if="tag.type === 'history'">
                                </template>-->
                <template v-else>
                  <div
                    v-show="!editing[tag.id]"
                    :class="tag.classes"
                    :style="getTagColorStyle(tag)"
                    :ref="'promptTagValue-' + tag.id"
                    v-tooltip="
                      tag.isLora || tag.isLyco
                        ? ''
                        : getLang('click_to_edit') +
                          '<br/>' +
                          getLang('dblclick_to_disable') +
                          '<br/>' +
                          getLang('drop_to_order')
                    "
                    @click="onTagClick(tag.id, $event)"
                    @dblclick="onTagDblclick(tag.id)"
                    @click.right.prevent="onTagRightClick(tag.id, $event)"
                    v-html="renderTag(tag.id)"
                  ></div>
                  <textarea
                    v-show="editing[tag.id]"
                    type="text"
                    class="scroll-hide svelte-4xt1ch input-tag-edit"
                    :ref="'promptTagEdit-' + tag.id"
                    :placeholder="getLang('enter_to_save')"
                    :value="tag.value"
                    @mousedown.stop=""
                    @mousemove.stop=""
                    @mouseup.stop=""
                    @blur="onTagInputBlur(tag.id)"
                    @keydown="onTagInputKeyDown(tag.id, $event)"
                    @change="onTagInputChange(tag.id, $event)"
                  ></textarea>
                  <!--<input v-show="editing[tag.id]" type="text"
                                           class="scroll-hide svelte-4xt1ch input-tag-edit"
                                           :ref="'promptTagEdit-' + tag.id" :placeholder="getLang('enter_to_save')"
                                           :value="tag.value" @blur="onTagInputBlur(tag.id)"
                                           @keydown="onTagInputKeyDown(tag.id, $event)"
                                           @change="onTagInputChange(tag.id, $event)">-->
                </template>
                <div
                  class="btn-tag-delete"
                  :ref="'promptTagDelete-' + tag.id"
                  @click="onDeleteTagClick(tag.id)"
                  @mousedown.stop=""
                  @mousemove.stop=""
                  @mouseup.stop=""
                >
                  <icon-svg name="close" />
                </div>
              </div>
              <div
                class="btn-tag-extend"
                v-animate="'fadeIn'"
                :style="getExtendMenuStyle(tag)"
                @click.stop=""
                @mousedown.stop=""
                @mousemove.stop=""
                @mouseup.stop=""
                @mouseenter.stop="onExtendMenuMouseEnter"
                @mouseleave.stop="onExtendMenuMouseLeave"
              >
                <vue-number-input
                  class="input-number"
                  name="input-number"
                  :model-value="getCurrentTagWeight(tag)"
                  center
                  controls
                  :min="-100"
                  :step="0.1"
                  size="small"
                  @update:model-value="onTagWeightNumChange(tag.id, $event)"
                ></vue-number-input>
                <button
                  type="button"
                  name="weight-parentheses-inc"
                  v-tooltip="getLang('increase_weight_add_parentheses')"
                  @click="onIncWeightClick(tag.id, +1)"
                >
                  <icon-svg
                    :name="
                      useNovelAiWeightSymbol
                        ? 'weight-braces-inc'
                        : 'weight-parentheses-inc'
                    "
                  />
                </button>
                <button
                  type="button"
                  name="weight-parentheses-dec"
                  v-tooltip="getLang('increase_weight_subtract_parentheses')"
                  @click="onIncWeightClick(tag.id, -1)"
                >
                  <icon-svg
                    :name="
                      useNovelAiWeightSymbol
                        ? 'weight-braces-dec'
                        : 'weight-parentheses-dec'
                    "
                  />
                </button>
                <button
                  type="button"
                  name="weight-brackets-inc"
                  v-tooltip="getLang('decrease_weight_add_brackets')"
                  @click="onDecWeightClick(tag.id, +1)"
                >
                  <icon-svg name="weight-brackets-inc" />
                </button>
                <button
                  type="button"
                  name="weight-brackets-dec"
                  v-tooltip="getLang('decrease_weight_subtract_brackets')"
                  @click="onDecWeightClick(tag.id, -1)"
                >
                  <icon-svg name="weight-brackets-dec" />
                </button>
                <button
                  type="button"
                  name="wrap"
                  v-tooltip="getLang('line_break_character')"
                  @click="onWrapTagClick(tag.id)"
                >
                  <icon-svg name="wrap" />
                </button>

                <button
                  type="button"
                  name="copy"
                  v-tooltip="getLang('copy_to_clipboard')"
                  @click="copy(tag.value)"
                >
                  <icon-svg name="copy" />
                </button>
                <button
                  type="button"
                  name="favorite"
                  v-tooltip="
                    getLang(
                      tag.isFavorite
                        ? 'remove_from_favorite'
                        : 'add_to_favorite'
                    )
                  "
                  @click="onFavoriteTagClick(tag.id)"
                >
                  <icon-svg v-if="tag.isFavorite" name="favorite-yes" />
                  <icon-svg v-if="!tag.isFavorite" name="favorite-no" />
                </button>
                <button
                  type="button"
                  name="blacklist"
                  v-tooltip="getLang('add_blacklist')"
                  @click="onBlacklistClick(tag.id)"
                >
                  <icon-svg name="blacklist" />
                </button>
                <button
                  type="button"
                  name="enable"
                  v-tooltip="
                    categoryTermHoverData &&
                    categoryTermHoverData.tag.id === tag.id
                      ? categoryTermHoverData.termValue.startsWith('[') &&
                        categoryTermHoverData.termValue.endsWith(']')
                        ? 'Enable this term'
                        : 'Disable this term'
                      : getLang(
                          tag.disabled ? 'enable_keyword' : 'disable_keyword'
                        )
                  "
                  @click="onDisabledTagClick(tag.id)"
                >
                  <icon-svg v-if="!tag.disabled" name="disabled" />
                  <icon-svg v-if="tag.disabled" name="enable" />
                </button>
                <button
                  type="button"
                  name="delete-term"
                  v-tooltip="
                    categoryTermHoverData &&
                    categoryTermHoverData.tag.id === tag.id
                      ? 'Delete this term'
                      : getLang('delete_keyword') || 'Delete keyword'
                  "
                  @click="onDeleteTermClick(tag.id)"
                >
                  <icon-svg name="remove" />
                </button>
              </div>
            </div>

          </div>
          <div
            v-for="(tag, index) in tags"
            :key="tag.id"
            :class="['prompt-wrap', tag.type === 'wrap' ? 'wrap-tag' : '']"
            :data-id="tag.id"
            ref="promptTagWrap"
            @mousedown.stop=""
            @mousemove.stop=""
            @mouseup.stop=""
          ></div>
        </div>
        <!--<div class="prompt-append">
                    <input type="text" class="scroll-hide svelte-4xt1ch input-tag-append" ref="promptTagAppend"
                           v-model="appendTag" :placeholder="getLang('please_enter_new_keyword')"
                           v-tooltip="getLang('enter_to_add')" @keydown="onAppendTagKeyDown">
                </div>-->
        <div
          class="drop-select-bg"
          ref="dropSelectBg"
          :style="{ display: dropIsStart ? 'block' : 'none' }"
        ></div>
        <div
          class="drop-select-box"
          ref="dropSelectBox"
          :style="{
            display: dropIsSelecting ? 'block' : 'none',
            top: dropArea.top + 'px',
            left: dropArea.left + 'px',
            width: dropArea.width + 'px',
            height: dropArea.height + 'px',
          }"
        ></div>
        <div
          class="drop-select-btns"
          ref="dropSelectBtns"
          :style="{
            display: dropIsEnd && dropTags.length ? 'flex' : 'none',
            top: dropEndY - 32 + 'px',
            left: dropEndX + 'px',
          }"
          @mousedown.stop=""
          @mousemove.stop=""
          @mouseup.stop=""
        >
          <div class="btns-title">{{ getLang("batch_operation") }}</div>
          <button
            type="button"
            v-tooltip="getLang('copy_to_clipboard')"
            @click="onDropCopy"
          >
            <icon-svg name="copy" />
          </button>
          <button
            type="button"
            v-tooltip="getLang('add_to_favorite')"
            @click="onDropFavorite"
          >
            <icon-svg name="favorite-no" />
          </button>
          <button
            type="button"
            v-tooltip="getLang('disable_keyword')"
            @click="onDropDisable"
          >
            <icon-svg name="disabled" />
          </button>
          <button
            type="button"
            v-tooltip="getLang('enable_keyword')"
            @click="onDropEnable"
          >
            <icon-svg name="enable" />
          </button>
          <button type="button" @click="onDropDelete">
            <icon-svg name="remove" />
          </button>
        </div>
      </div>
      <div
        v-if="groupTagsProcessed.length"
        :class="['show-group-tags', hideGroupTags ? 'hided' : '']"
        @click="onClickHideGroupTags"
        v-tooltip="
          getLang(hideGroupTags ? 'show_group_tags' : 'hide_group_tags')
        "
      >
        <icon-svg class="hover-scale-120" name="unfold" />
      </div>
      <Transition name="fade">
        <div
          class="group-tabs"
          v-show="!hideGroupTags && groupTagsProcessed.length"
        >
          <div class="group-header" ref="groupTabsHeader">
            <div
              v-for="(item, index) in groupTagsProcessed"
              :key="index"
              :class="[
                'group-tab',
                item.tabKey == groupTagsActive ? 'active' : '',
              ]"
              @click="activeGroupTab(index)"
              :data-name="item.name"
            >
              {{ item.name }}
            </div>
          </div>
          <div class="group-body">
            <div
              v-for="(item, index) in groupTagsProcessed"
              :key="index"
              :class="[
                'group-main',
                item.tabKey == groupTagsActive ? 'active' : '',
              ]"
            >
              <div
                class="sub-group-header"
                v-if="item.tabKey == groupTagsActive"
              >
                <div
                  v-for="(group, subIndex) in item.groups"
                  :key="subIndex"
                  :class="[
                    group.type && group.type === 'wrap'
                      ? 'sub-group-tag-wrap'
                      : 'sub-group-tab',
                    group.tabKey == subGroupTagsActive ? 'active' : '',
                  ]"
                  @click="activeSubGroupTab(index, subIndex)"
                  :data-name="group.name"
                >
                  {{ group.name }}
                </div>
              </div>
              <div class="sub-group-body" v-if="item.tabKey == groupTagsActive">
                <div
                  v-for="(group, subIndex) in item.groups"
                  :key="subIndex"
                  :class="[
                    'sub-group-main',
                    group.tabKey == subGroupTagsActive ? 'active' : '',
                  ]"
                >
                  <Transition name="fade">
                    <div
                      class="group-tags"
                      v-if="group.tabKey == subGroupTagsActive"
                    >
                      <div
                        v-if="group.type === 'extraNetworks'"
                        class="group-extra-network"
                        v-for="extraData in group.datas"
                        :key="extraData.name"
                        @click="
                          onClickGroupTagExtraNetwork(extraData, item, group)
                        "
                        @mouseenter="
                          onGroupExtraNetworkMouseEnter($event, extraData.name)
                        "
                        @mousemove="onGroupExtraNetworkMouseMove"
                        @mouseleave="onGroupExtraNetworkMouseLeave"
                        :style="getGroupTagExtraNetworkStyle(extraData)"
                      >
                        <img
                          class="extra-network-preview"
                          :src="
                            extraData.preview ||
                            './file=html/card-no-preview.png'
                          "
                        />
                        <div class="extra-network-name">
                          {{ extraData.name }}
                        </div>
                        <div
                          class="extra-network-loading"
                          v-if="extraData.loading"
                        >
                          <icon-svg name="loading" />
                        </div>
                      </div>
                      <div
                        v-else
                        class="tag-item"
                        ref="groupTagItem"
                        v-for="(local, en) in group.tags"
                        v-tooltip="getGroupTagTooltip(local, en)"
                        @click="onClickGroupTag(local, en, item, group)"
                      >
                        <template v-if="local && local != en">
                          <div
                            class="tag-local"
                            :style="getGroupTagStyle(item.name, group.name, en)"
                          >
                            {{ local }}
                          </div>
                          <div class="tag-en">{{ en }}</div>
                        </template>
                        <div
                          v-else
                          class="tag-local"
                          :style="getGroupTagStyle(item.name, group.name, en)"
                        >
                          {{ en }}
                        </div>
                      </div>
                    </div>
                  </Transition>
                  <div class="tags-footer" v-if="item.type === 'extraNetworks'">
                    <div class="tags-size">
                      <div
                        class="tags-size-item"
                        @click="onClickGroupExtraNetworkRefresh"
                      >
                        <icon-svg
                          v-if="extraNetworksRefreshing"
                          name="loading"
                        />
                        <icon-svg
                          v-if="!extraNetworksRefreshing"
                          class="hover-scale-120"
                          name="refresh"
                        />
                        <div class="size-title">
                          {{ this.getLang("refresh") }}
                        </div>
                      </div>
                      <div class="tags-size-item">
                        <!--<input class="size-range" type="range" min="10" max="1000" step="1"
                                                       :value="extraNetworksWidth"
                                                       @change="$emit('update:extraNetworksWidth', $event.target.value)"/>-->
                        <input
                          class="size-number"
                          type="number"
                          min="10"
                          max="1000"
                          step="1"
                          :value="extraNetworksWidth"
                          @change="
                            $emit(
                              'update:extraNetworksWidth',
                              $event.target.value
                            )
                          "
                        />
                        <div class="size-title">
                          {{ this.getLang("width") }}
                        </div>
                      </div>
                      <div class="tags-size-item">
                        <!--<input class="size-range" type="range" min="10" max="1000" step="1"
                                                       :value="extraNetworksHeight"
                                                       @change="$emit('update:extraNetworksHeight', $event.target.value)"/>-->
                        <input
                          class="size-number"
                          type="number"
                          min="10"
                          max="1000"
                          step="1"
                          :value="extraNetworksHeight"
                          @change="
                            $emit(
                              'update:extraNetworksHeight',
                              $event.target.value
                            )
                          "
                        />
                        <div class="size-title">
                          {{ this.getLang("height") }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="tags-footer"
                    v-if="
                      item.type !== 'favorite' && item.type !== 'extraNetworks'
                    "
                  >
                    <div class="tags-color">
                      <div>{{ getLang("tags_color") }}:</div>
                      <div
                        class="tags-color-picker hover-scale-120"
                        v-tooltip="
                          groupTagsColor[getTagsColorKey(item.name, group.name)]
                        "
                        unaffected="true"
                      >
                        <color-picker
                          :theme="theme == 'dark' ? 'black' : 'white'"
                          v-model:pureColor="
                            groupTagsColor[
                              getTagsColorKey(item.name, group.name)
                            ]
                          "
                          @pureColorChange="
                            onTagsColorChange(
                              getTagsColorKey(item.name, group.name)
                            )
                          "
                        />
                      </div>
                      <div
                        class="tags-color-reset hover-scale-120"
                        v-tooltip="getLang('reset_default_color')"
                        @click="
                          onClickResetTagsColor(
                            getTagsColorKey(item.name, group.name)
                          )
                        "
                      >
                        <icon-svg name="reset" />
                      </div>
                      <div
                        class="tags-color-clear hover-scale-120"
                        v-tooltip="getLang('clear_color')"
                        @click="
                          onClickClearTagsColor(
                            getTagsColorKey(item.name, group.name)
                          )
                        "
                      >
                        <icon-svg name="clear" />
                      </div>
                    </div>
                    <div class="tags-copyright">
                      {{ getLang("tags-copyright") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <highlight-prompt
      ref="highlightPrompt"
      :textarea="textarea"
      :hide-default-input="hideDefaultInput"
    />
  </div>
</template>

<script>
import Sortable from "sortablejs";

import common from "@/utils/common";
import waitTick from "@/utils/waitTick";

import LanguageMixin from "@/mixins/languageMixin";
import VueNumberInput from "@/components/vue-number-input.vue";
import HeaderMixin from "@/mixins/phystonPrompt/headerMixin";
import DropMixin from "@/mixins/phystonPrompt/dropMixin";
import TagMixin from "@/mixins/phystonPrompt/tagMixin";
import GroupTagsMixin from "@/mixins/phystonPrompt/groupTagsMixin";
import IconSvg from "@/components/iconSvg.vue";
import HighlightPrompt from "@/components/highlightPrompt.vue";
import { ColorPicker } from "vue3-colorpicker";

export default {
  name: "PhystonPrompt",
  components: {
    HighlightPrompt,
    VueNumberInput,
    IconSvg,
    ColorPicker,
  },
  mixins: [LanguageMixin, HeaderMixin, DropMixin, TagMixin, GroupTagsMixin],
  props: {
    name: {
      type: String,
      required: true,
    },
    neg: {
      type: Boolean,
      default: false,
    },
    textarea: {
      type: Object,
      required: true,
    },
    steps: {
      type: Object,
      required: true,
    },

    autoRemoveSpace: {
      type: Boolean,
      default: false,
    },
    autoRemoveLastComma: {
      type: Boolean,
      default: false,
    },
    autoKeepWeightZero: {
      type: Boolean,
      default: false,
    },
    autoKeepWeightOne: {
      type: Boolean,
      default: false,
    },
    autoBreakBeforeWrap: {
      type: Boolean,
      default: false,
    },
    autoBreakAfterWrap: {
      type: Boolean,
      default: false,
    },
    autoRemoveLoraBeforeComma: {
      type: Boolean,
      default: false,
    },
    autoRemoveLoraAfterComma: {
      type: Boolean,
      default: false,
    },
    useNovelAiWeightSymbol: {
      type: Boolean,
      default: false,
    },
    autoRemoveBeforeLineComma: {
      type: Boolean,
      default: false,
    },
    autoFormatCategorySpacing: {
      type: Boolean,
      default: true,
    },
    autoRemoveCategoryTrailingComma: {
      type: Boolean,
      default: true,
    },
    hideDefaultInput: {
      type: Boolean,
      default: false,
    },
    autoLoadWebuiPrompt: {
      type: Boolean,
      default: true,
    },
    hidePanel: {
      type: Boolean,
      default: false,
    },
    enableTooltip: {
      type: Boolean,
      default: true,
    },
    enableNativeHighlighting: {
      type: Boolean,
      default: true,
    },
    historyKey: {
      type: String,
      default: "",
    },
    favoriteKey: {
      type: String,
      default: "",
    },
    extraNetworks: {
      type: Array,
      default: () => [],
    },
    loras: {
      type: Array,
      default: () => [],
    },
    lycos: {
      type: Array,
      default: () => [],
    },
    embeddings: {
      type: Array,
      default: () => [],
    },
    version: {
      type: String,
      default: "",
    },
    latestVersion: {
      type: String,
      default: "",
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      default: "dark",
    },
    groupTags: {
      type: Array,
      default: () => [],
    },
    extraNetworksWidth: {
      type: Number,
      default: 100,
    },
    extraNetworksHeight: {
      type: Number,
      default: 120,
    },
    hideGroupTags: {
      type: Boolean,
      default: false,
    },
    groupTagsColor: {
      type: Object,
      default: () => ({}),
    },
    groupTagsColorKeyCache: {
      type: Object,
      default: () => ({}),
    },
    blacklist: {
      type: Object,
      default: () => ({}),
    },
    cancelBlacklistConfirm: {
      type: Boolean,
      default: false,
    },
    hotkey: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: [
    "update:languageCode",

    "update:autoRemoveSpace",
    "update:autoRemoveLastComma",
    "update:autoKeepWeightZero",
    "update:autoKeepWeightOne",
    "update:hideDefaultInput",
    "update:hidePanel",
    "update:enableTooltip",
    "update:enableNativeHighlighting",

    "click:promptFormat",
    "click:blacklist",
    "click:hotkey",
    "click:syntaxHighlightingSettings",
    "click:selectTheme",
    "click:switchTheme",
    "click:showAbout",
    "click:selectLanguage",
    "click:showHistory",
    "click:showFavorite",
    "refreshFavorites",

    "update:hideGroupTags",
    "update:groupTagsColor",
    "update:blacklist",
    "showExtraNetworks",
    "hideExtraNetworks",
    "refreshExtraNetworks",
    "update:extraNetworksWidth",
    "update:extraNetworksHeight",
    "update:autoLoadWebuiPrompt",
  ],
  data() {
    return {
      prompt: "",
      counterText: "0/75",
      tags: [],

      sortable: null,
      droping: false,
      loading: {},
      editing: {},
      isEditing: false,
      colorRefreshKey: 0, // Key to force re-rendering when colors change

      // Performance optimization flags
      _updatingPrompt: false,
      _performanceMode: false,
      _lastPromptLength: 0,
    };
  },
  computed: {
    isEnglish() {
      return this.languageCode === "en_US";
    },

  },
  watch: {
    loras: {
      handler() {
        this.tags.forEach((tag) => {
          this._setTagClass(tag);
        });
        // Ensure custom colors are applied after class updates
        this.$nextTick(() => {
          this._applyCustomColorsToTags();
        });
      },
      immediate: false,
    },
    lycos: {
      handler() {
        this.tags.forEach((tag) => {
          this._setTagClass(tag);
        });
        // Ensure custom colors are applied after class updates
        this.$nextTick(() => {
          this._applyCustomColorsToTags();
        });
      },
      immediate: false,
    },
    embeddings: {
      handler() {
        this.tags.forEach((tag) => {
          this._setTagClass(tag);
        });
        // Ensure custom colors are applied after class updates
        this.$nextTick(() => {
          this._applyCustomColorsToTags();
        });
      },
      immediate: false,
    },
  },
  mounted() {
    if (this.$appMode) {
      this.counterText = "";
    }
    this.$nextTick(() => {
      this.initSortable();
      // autoSizeInput(this.$refs.promptTagAppend)
      let times = [1000, 3000, 5000, 10000, 20000, 30000];
      let isBind = false;
      times.forEach((time) => {
        if (isBind) return;
        setTimeout(() => {
          // console.log(this.name, '1111111111111111111111')
          if (isBind) return;
          // console.log(this.name, '3333333333333333333333')
          if (typeof addAutocompleteToArea !== "function") return;
          // console.log(this.name, '4444444444444444444444')
          if (typeof TAC_CFG !== "object") return;
          // console.log(this.name, '5555555555555555555555')
          if (!TAC_CFG) return;
          // console.log(this.name, '6666666666666666666666')
          if (!TAC_CFG["activeIn"]) return;
          // console.log(this.name, '7777777777777777777777')
          isBind = true;
          addAutocompleteToArea(this.$refs.promptTagAppend);
          // console.log(this.name, '2222222222222222222222')
        }, time);
      });
      this.init();

      // Setup category term hover listeners after initial render
      this.$nextTick(() => {
        if (this._setupCategoryTermHoverListeners) {
          this._setupCategoryTermHoverListeners();
        }
      });
    });
  },
  methods: {
    init() {
      this.tags = [];
      this.onTextareaChange();

      let oldValue = this.textarea.value;
      setInterval(() => {
        if (this.autoLoadWebuiPrompt) {
          let newValue = this.textarea.value;
          if (oldValue === newValue) return;
          // 如果焦点在 textarea 上，就不要触发 onTextareaChange 了
          if (document.activeElement === this.textarea) return;
          oldValue = newValue;
          // Use debounced change detection for auto-loading
          waitTick.debounce('autoLoadWebui', () => {
            this.onTextareaChange(true);
          }, 300, this);
        }
      }, 1000); // Reduced frequency from 500ms to 1000ms
      // this.textarea.removeEventListener('change', this.onTextareaChange)
      // this.textarea.addEventListener('change', this.onTextareaChange)
      // this.textarea.removeEventListener('blur', this.onTextareaChange)
      // this.textarea.addEventListener('blur', this.onTextareaChange)
    },
    onTextareaChange(event) {
      if (this.onTextareaChangeTimeId)
        clearTimeout(this.onTextareaChangeTimeId);
      this.onTextareaChangeTimeId = setTimeout(() => {
        this._onTextareaChange(event);
      }, 100);
    },
    _onTextareaChange(event) {
      console.log("onTextareaChange", event);

      // Check if autocomplete is active - if so, don't process
      const autocompleteParent =
        this.textarea.parentElement.getElementsByClassName(
          "autocompleteParent"
        );
      if (autocompleteParent.length) {
        if (autocompleteParent[0].style.display !== "none") return;
      } else {
        const autocompleteResults =
          this.textarea.parentElement.getElementsByClassName(
            "autocompleteResults"
          );
        if (autocompleteResults.length > 0) {
          if (autocompleteResults[0].style.display !== "none") return;
        }
      }

      let value = this.textarea.value.trim();

      // Early return if no change
      if (value === this.prompt.trim()) return;

      // Debounce text processing to prevent rapid changes from removing terms
      this._checkPerformanceMode();
      const delay = this._getDebounceDelay('text-processing');

      waitTick.debounce('textareaChange', () => {
        this._processTextareaChange(value);
      }, delay, this);
    },

    _processTextareaChange(value) {
      let tags = common.splitTags(
        value,
        this.autoBreakBeforeWrap,
        this.autoBreakAfterWrap
      );

      // Optimize disabled tags handling
      let disabledTags = [];
      this.tags.forEach((tag, index) => {
        if (tag.disabled) {
          disabledTags.push({ tag, index });
        }
      });
      disabledTags.forEach(({ tag, index }) => {
        // 插入到 tags 中
        tags.splice(index, 0, tag.value);
      });

      // Create a map for faster lookups
      const oldTagsMap = new Map();
      this.tags.forEach(tag => {
        oldTagsMap.set(tag.value, tag);
      });

      let indexes = [];
      const newTags = [];

      // Process tags more efficiently
      for (let i = 0; i < tags.length; i++) {
        let tag = tags[i];
        if (tag === "") continue;

        if (tag === "\n") {
          const id = Date.now() + (Math.random() * 1000000).toFixed(0) + i;
          const wrapTag = {
            id,
            value: "\n",
            localValue: "\n",
            disabled: false,
            type: "wrap"
          };
          this._setTag(wrapTag);
          newTags.push(wrapTag);
        } else {
          // Use map for faster lookup
          const existingTag = oldTagsMap.get(tag);
          const localValue = existingTag ? existingTag.localValue : "";
          const disabled = existingTag ? existingTag.disabled : false;

          const id = Date.now() + (Math.random() * 1000000).toFixed(0) + i;
          const textTag = {
            id,
            value: tag,
            localValue: localValue,
            disabled: disabled,
            type: "text"
          };
          this._setTag(textTag);

          if (!this._isTagBlacklist(textTag)) {
            newTags.push(textTag);
            if (!existingTag) {
              indexes.push(newTags.length - 1);
            }
          }
        }
      }

      // Update tags array in one operation
      this.tags = newTags;
      this.updateTagsDebounced(150);
    },
    _setTextareaFocus() {
      if (typeof get_uiCurrentTabContent !== "function") return;
      if (typeof activePromptTextarea !== "object") return;
      const currentTab = get_uiCurrentTabContent();
      if (!currentTab) return;
      let tabName = currentTab.id.replace("tab_", "");
      if (!tabName) return;
      activePromptTextarea[tabName] = this.textarea;
    },
    copy(text) {
      this.$copyText(text)
        .then(() => {
          this.$toastr.success(this.getLang("success"));
        })
        .catch(() => {
          this.$toastr.error(this.getLang("failed"));
        });
    },
    genPrompt(tags = null, ignoreDisabled = false) {
      tags = tags || this.tags;

      // Early return for empty tags
      if (!tags || tags.length === 0) {
        return "";
      }

      let prompts = [];
      let tags2 = [];

      // Optimize filtering for large tag arrays
      if (!ignoreDisabled) {
        tags2 = tags.filter(tag => !tag.disabled);
      } else {
        tags2 = tags;
      }

      let length = tags2.length;

      // Early return if no enabled tags
      if (length === 0) {
        return "";
      }
      tags2.forEach((tag, index) => {
        let prompt = "";
        if (typeof tag["type"] === "string" && tag.type === "wrap") {
          prompt = "\n";
        } else {
          let value = common.replaceTag(tag.value);
          if (value !== tag.value) {
            tag.value = value;
            this._setTag(tag);
          }

          // Apply category formatting if enabled
          if (
            this.autoFormatCategorySpacing ||
            this.autoRemoveCategoryTrailingComma
          ) {
            const formattedValue = this._formatCategoryDeclaration(value);
            if (formattedValue !== value) {
              tag.value = formattedValue;
              this._setTag(tag);
              value = formattedValue;
            }
          }

          // Filter out disabled terms from category declarations
          value = this._filterDisabledCategoryTerms(value);

          // Skip this tag if the filtered value is empty (all terms were disabled)
          if (value === "") {
            return;
          }

          let localValue = common.replaceTag(tag.localValue);
          if (localValue !== tag.localValue) {
            tag.localValue = localValue;
          }

          if (tag.weightNum > 0 || tag.weightNum < 0) {
            tag.weightNum = Number(parseFloat(tag.weightNum).toFixed(6));
            tag.value = tag.value.replace(
              common.weightNumRegex,
              "$1:" + tag.weightNum
            );
            if (tag.localValue !== "") {
              tag.localValue = tag.localValue.replace(
                common.weightNumRegex,
                "$1:" + tag.weightNum
              );
            }
          }
          if (tag.disabled && !ignoreDisabled) return;

          let splitSymbol = "," + (this.autoRemoveSpace ? "" : " ");
          let splitSymbolDefault = splitSymbol;

          let nextTag = null;
          let nextIsWarp = false;
          let nextIsBreak = false;
          let nextIsLora = false;
          let nextIsLyco = false;
          // 获取下一个按钮
          if (index + 1 < length) {
            nextTag = tags2[index + 1];
            if (
              typeof nextTag["type"] === "string" &&
              nextTag.type === "wrap"
            ) {
              nextIsWarp = true;
            } else if (nextTag.value === "BREAK") {
              nextIsBreak = true;
            } else if (nextTag.isLora) {
              nextIsLora = true;
            } else if (nextTag.isLyco) {
              nextIsLyco = true;
            }
          }

          if (nextIsWarp) {
            // 如果下一个是换行

            if (this.autoRemoveBeforeLineComma) {
              splitSymbol = "";
            } else {
              // sd-webui-regional-prompter
              const regionals = [
                " BREAK",
                " ADDCOL",
                " ADDROW",
                " ADDCOMM",
                " ADDBASE",
              ];
              for (const regional of regionals) {
                if (tag.value.endsWith(regional)) {
                  // 如果是sd-webui-regional-prompter，那么就不需要加逗号
                  splitSymbol = "";
                }
              }
            }
          } else if (nextIsBreak) {
            splitSymbol = " ";
          } else if (
            (nextIsLora || nextIsLyco) &&
            this.autoRemoveLoraBeforeComma
          ) {
            splitSymbol = this.autoRemoveSpace ? "" : " ";
          }

          if (tag.value === "BREAK") {
            if (nextIsWarp) {
              splitSymbol = "";
            } else {
              splitSymbol = " ";
            }
          }

          if (this.autoRemoveLastComma && index + 1 === length) {
            // 如果是最后一个，那么就不需要加逗号
            splitSymbol = "";
          }

          if (
            splitSymbol === splitSymbolDefault &&
            (tag.isLora || tag.isLyco) &&
            this.autoRemoveLoraAfterComma
          ) {
            splitSymbol = this.autoRemoveSpace ? "" : " ";
          }

          prompt = tag.value + splitSymbol;
        }

        if (prompt) prompts.push(prompt);
      });
      if (prompts.length <= 0) return "";
      // console.log('update tags', prompts)
      return prompts.join("");
    },
    updatePrompt() {
      let insertWrapIndexes = [];
      let length = this.tags.length;
      for (let i = 0; i < length; i++) {
        let tag = this.tags[i];
        if (tag.value === "BREAK") {
          if (this.autoBreakBeforeWrap) {
            // 如果是在“BREAK”关键词前面加换行符
            // 判断上一个是否换行符
            if (i - 1 >= 0) {
              let prevTag = this.tags[i - 1];
              if (
                typeof prevTag["type"] === "string" &&
                prevTag.type === "wrap"
              ) {
                // 上一个已经是换行了
              } else {
                insertWrapIndexes.push(i);
              }
            }
          }
          if (this.autoBreakAfterWrap) {
            // 如果是在“BREAK”关键词后面加换行符
            // 判断下一个是否换行符
            if (i + 1 < length) {
              let nextTag = this.tags[i + 1];
              if (
                typeof nextTag["type"] === "string" &&
                nextTag.type === "wrap"
              ) {
                // 下一个已经是换行了
              } else {
                insertWrapIndexes.push(i + 1);
              }
            }
          }
        }
      }
      for (let i = 0; i < insertWrapIndexes.length; i++) {
        let index = insertWrapIndexes[i] + i;
        this._appendTag("\n", "\n", false, index, "wrap");
      }
      if (insertWrapIndexes.length) {
        // Use debounced update to prevent immediate recursion
        waitTick.debounce('updatePrompt-recursive', () => {
          this.updateTags();
        }, 50, this);
        return;
      }

      // Generate and update prompt
      const newPrompt = this.genPrompt();

      // Only update if prompt actually changed
      if (this.prompt !== newPrompt) {
        this.prompt = newPrompt;
        this.textarea.value = this.prompt;

        // Debounce DOM operations for better performance
        waitTick.debounce('updatePrompt-dom', () => {
          common.hideCompleteResults(this.textarea);
          if (typeof updateInput === "function") {
            updateInput(this.textarea);
          } else {
            this.textarea.dispatchEvent(new Event("input"));
          }
        }, 50, this);
      }
    },
    updateTags() {
      console.log("tags change", this.tags);
      this.updatePrompt();

      // Debounce expensive operations
      waitTick.debounce('updateTags-tokenCounter', () => {
        const steps = this.steps.querySelector('input[type="number"]').value;
        if (!this.$appMode) {
          this.gradioAPI.tokenCounter(this.textarea.value, steps).then((res) => {
            const { token_count, max_length } = res;
            this.counterText = `${token_count}/${max_length}`;
          });
        }
      }, 500, this);

      // Debounce history operations
      if (this.tags.length) {
        waitTick.debounce('updateTags-history', () => {
          this.gradioAPI
            .getLatestHistory(this.historyKey)
            .then((res) => {
              if (res && res.prompt === this.prompt) {
                // 如果有上一条记录，并且prompt相同，则更新
                this.gradioAPI
                  .setHistory(
                    this.historyKey,
                    res.id,
                    this.tags,
                    this.prompt,
                    res.name
                  )
                  .then((res) => {})
                  .catch((err) => {});
              } else {
                this.gradioAPI
                  .pushHistory(this.historyKey, this.tags, this.prompt)
                  .then((res) => {})
                  .catch((err) => {});
              }
            })
            .catch((err) => {});
        }, 1000, this);
      }

      // Debounce DOM operations
      waitTick.debounce('updateTags-dom', () => {
        this.$nextTick(() => {
          for (let i = 0; i < this.$refs.promptTagsList.children.length; i++) {
            let tag = this.$refs.promptTagsList.children[i];
            if (!tag.classList.contains("prompt-tag")) continue;
            let id = tag.getAttribute("data-id");
            let wrap = this.$refs.promptTagWrap.find((wrap) => {
              return wrap.getAttribute("data-id") === id;
            });
            if (wrap) tag.parentNode.insertBefore(wrap, tag.nextElementSibling);
          }
        });
      }, 100, this);
    },

    /**
     * Debounced version of updateTags for user interactions
     * @param {number} delay - Custom delay in milliseconds (optional, will use performance-aware default)
     */
    updateTagsDebounced(delay = null) {
      this._checkPerformanceMode();
      const actualDelay = delay || this._getDebounceDelay('tag-change');

      waitTick.debounce('updateTags-main', () => {
        this.updateTags();
      }, actualDelay, this);
    },

    /**
     * Immediate update for critical operations
     */
    updateTagsImmediate() {
      // Cancel any pending debounced updates
      waitTick.cancelDebounce('updateTags-main');
      this.updateTags();
    },

    /**
     * Check if performance mode should be enabled based on prompt length
     */
    _checkPerformanceMode() {
      const currentLength = this.tags.length;
      const shouldEnablePerformanceMode = currentLength > 100; // Enable for prompts with >100 tags

      if (shouldEnablePerformanceMode !== this._performanceMode) {
        this._performanceMode = shouldEnablePerformanceMode;
        console.log(`[PromptAllInOne] Performance mode ${shouldEnablePerformanceMode ? 'enabled' : 'disabled'} (${currentLength} tags)`);
      }

      this._lastPromptLength = currentLength;
    },

    /**
     * Get appropriate debounce delay based on performance mode and operation type
     */
    _getDebounceDelay(operationType = 'default') {
      if (this._performanceMode) {
        switch (operationType) {
          case 'user-input': return 300;
          case 'tag-change': return 200;
          case 'text-processing': return 500;
          case 'dom-update': return 150;
          default: return 400;
        }
      } else {
        switch (operationType) {
          case 'user-input': return 150;
          case 'tag-change': return 100;
          case 'text-processing': return 250;
          case 'dom-update': return 50;
          default: return 200;
        }
      }
    },
    onResize() {
      this.tags.forEach((tag) => {
        this._setTagHeight(tag);
      });
    },
    initSortable() {
      this.sortable = Sortable.create(this.$refs.promptTagsList, {
        animation: 150,
        handle: ".prompt-tag-value",
        draggable: ".prompt-tag",
        onEnd: (env) => {
          if (this.dropTags.length) {
            let current = env.item;
            let currentId = current.getAttribute("data-id");
            let dropTags = this._getDropTagsEle();
            let currentIndex = dropTags.findIndex((tag) => {
              return tag.getAttribute("data-id") === currentId;
            });
            let beforeTags = dropTags.slice(0, currentIndex);
            let afterTags = dropTags.slice(currentIndex + 1).reverse();
            // 移动 dropTags 中的html节点按照原始顺序到current的周围
            beforeTags.forEach((tag) => {
              common.insertBefore(tag, current);
            });
            afterTags.forEach((tag) => {
              common.insertAfter(tag, current);
            });
          }

          this._dropOver();
          this.droping = false;

          let newIndexes = [];
          let $tags = {};
          for (let i = 0; i < this.$refs.promptTagsList.children.length; i++) {
            let tag = this.$refs.promptTagsList.children[i];
            if (!tag.classList.contains("prompt-tag")) continue;
            let id = tag.getAttribute("data-id");
            newIndexes.push(id);
            $tags[id] = tag;
          }
          this.tags = this.tags.sort((a, b) => {
            return newIndexes.indexOf(a.id) - newIndexes.indexOf(b.id);
          });
          this.$forceUpdate();
          this.updateTags();

          /*let oldIndex = env.oldDraggableIndex
                    let newIndex = env.newDraggableIndex
                    if (oldIndex === newIndex) {
                        if (env.oldIndex !== env.newIndex) {
                            // 强制换回去
                            let oldElement = this.$refs.promptTagsList.children[env.oldIndex]
                            let newElement = this.$refs.promptTagsList.children[env.newIndex]
                            common.swapElement(oldElement, newElement)
                            return
                        }
                    }

                    const tags = [...this.tags]
                    tags.splice(newIndex, 0, tags.splice(oldIndex, 1)[0])

                    this.tags = tags
                    this.$forceUpdate()
                    this.updateTags()*/
        },
        onChoose: (env) => {
          console.log(env);
          if (this.dropTags.length) {
            let current = env.item;
            let currentId = current.getAttribute("data-id");
            let dropTags = this._getDropTagsEle();
            dropTags.forEach((tag) => {
              if (tag.getAttribute("data-id") === currentId) return;
              tag.style.display = "block";
              tag.style.transition = "transform 0.2s";
              tag.style.transform = "scale(0)";
              setTimeout(() => {
                tag.style.transition = "";
                tag.style.transform = "";
                tag.style.display = "none";
              }, 300);
            });
          }
          this.editing = {};
          this.isEditing = false;
          this.droping = true;
        },
        onUnchoose: (env) => {
          this.droping = null;
          if (this.dropTags.length) {
            let current = env.item;
            let currentId = current.getAttribute("data-id");
            let dropTags = this._getDropTagsEle();
            dropTags.forEach((tag) => {
              if (tag.getAttribute("data-id") === currentId) return;
              tag.style.display = "";
            });
          }
        },
        /*onSpill: function (evt) {
                    evt.item // The spilled item
                }*/
        /*multiDrag: true, // Enable the plugin
                selectedClass: "sortable-selected", // Class name for selected item
                multiDragKey: 'SHIFT', // Key that must be down for items to be selected
                avoidImplicitDeselect: false,*/
      });
    },
    useHistory(history) {
      this.tags = [];
      history.tags.forEach((item) => {
        this._appendTag(
          item.value,
          item.localValue,
          item.disabled,
          -1,
          item.type || "text"
        );
      });
      this.updateTags();
    },
    useFavorite(favorite) {
      this.useHistory(favorite);
    },

    onPromptMainClick() {
      if (this.autoLoadWebuiPrompt) {
        this.onTextareaChange(true);
      }
      this._setTextareaFocus();
      this.showExtendId = "";
    },




    refreshTags() {
      // Force re-render of all tags to apply new colors (SAFE VERSION)
      // Force re-render of all tags to apply new colors

      // ENHANCED APPROACH: Force comprehensive tag style updates
      if (process.env.NODE_ENV === "development") {
        console.log("Processing", this.tags.length, "tags for color refresh");
      }

      this.tags.forEach((tag, index) => {
        // Re-apply tag classes with new colors
        this._setTagClass(tag);

        // Re-process tag content for syntax highlighting if needed
        if (tag.value && this._setTag) {
          this._setTag(tag);
        }

        // Force renderTag to be called again by updating a reactive property
        // This ensures the HTML content is regenerated with new colors
        tag.renderKey = Date.now() + Math.random();

        // Force Vue reactivity by updating tag properties
        tag.colorUpdateKey = Date.now();

        // Debug: Log tag class updates
        if (process.env.NODE_ENV === "development" && index < 3) {
          console.log(`Tag ${index}:`, tag.classes, tag.value);
        }
      });

      // Force Vue to re-render the component
      this.$forceUpdate();

      // Force complete re-render by updating the refresh key
      this.colorRefreshKey = Date.now();

      // Apply custom colors to all tags
      this._applyCustomColorsToTags();
    },

    _applyCustomColorsToTags() {
      // Apply custom colors directly to tag elements
      this.$nextTick(() => {
        const tagElements = this.$el.querySelectorAll(".prompt-tag-value");

        // Get current custom colors from parent (App.vue)
        const customColors = this.$parent.syntaxHighlightingColors || {
          embeddings: "#0066cc",
          loraNames: "#ff6600",
          regularTerms: "#00cc66",
          weightValueBoost: "#00cc66",
          weightValueReduce: "#ff6666",
          punctuation: "#9966cc",
          categoryNames: "#ff69b4",
        };

        tagElements.forEach((el, index) => {
          // Apply colors directly to elements based on their classes
          if (el.classList.contains("embedding-tag")) {
            el.style.setProperty("color", customColors.embeddings, "important");
          } else if (
            el.classList.contains("lora-tag") ||
            el.classList.contains("lyco-tag")
          ) {
            el.style.setProperty("color", customColors.loraNames, "important");
          } else if (el.classList.contains("regular-tag")) {
            el.style.setProperty(
              "color",
              customColors.regularTerms,
              "important"
            );
          }

          // Also apply colors to nested syntax highlighting elements
          const weightPunctuation = el.querySelectorAll(".weight-punctuation");
          weightPunctuation.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.punctuation,
              "important"
            );
          });

          const weightBoost = el.querySelectorAll(".weight-value-boost");
          weightBoost.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.weightValueBoost,
              "important"
            );
          });

          const weightReduce = el.querySelectorAll(".weight-value-reduce");
          weightReduce.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.weightValueReduce,
              "important"
            );
          });

          const categoryNames = el.querySelectorAll(".category-name");
          categoryNames.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.categoryNames,
              "important"
            );
          });

          const embeddingContent = el.querySelectorAll(".embedding-content");
          embeddingContent.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.embeddings,
              "important"
            );
          });

          const loraContent = el.querySelectorAll(".lora-content");
          loraContent.forEach((span) => {
            span.style.setProperty(
              "color",
              customColors.loraNames,
              "important"
            );
          });

          // Force style recalculation
          el.offsetHeight;
        });
      });
    },

    // Get the current weight for display in the number input
    getCurrentTagWeight(tag) {
      // If we're hovering over a category term, show its weight
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === tag.id
      ) {
        return this._getCategoryTermWeight(
          this.categoryTermHoverData.termValue
        );
      }
      // Otherwise show the normal tag weight
      return tag.weightNum;
    },

    // Get the style object for the extend menu with dynamic positioning
    getExtendMenuStyle(tag) {
      const baseStyle = {
        display:
          (tag.type === "text" || !tag.type) &&
          this.showExtendId === tag.id &&
          !this.editing[tag.id]
            ? "flex"
            : "none",
      };

      // If we're hovering over a category term, apply dynamic positioning
      if (
        this.categoryTermHoverData &&
        this.categoryTermHoverData.tag.id === tag.id &&
        this.categoryTermHoverData.position
      ) {
        const pos = this.categoryTermHoverData.position;
        return {
          ...baseStyle,
          position: "absolute",
          top: `${pos.top - 32}px`,
          left: `${pos.left}px`,
          zIndex: 1000,
        };
      }

      // Default positioning for regular tags
      return baseStyle;
    },

    // Format category declaration according to autoformat settings
    _formatCategoryDeclaration(value) {
      // Check if this is a category declaration
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = value.match(categoryRegex);

      if (!match) {
        return value; // Not a category declaration, return unchanged
      }

      const [, categoryName, termsStr] = match;

      // Check if this is actually weight syntax (numeric value after colon)
      const isWeightSyntax = /^\s*\-?[0-9\.]+\s*$/.test(termsStr);
      if (isWeightSyntax) {
        return value; // This is weight syntax, not a category declaration
      }

      let formattedValue = value;

      if (
        this.autoFormatCategorySpacing ||
        this.autoRemoveCategoryTrailingComma
      ) {
        // Parse and normalize the terms
        const terms = termsStr
          .split(",")
          .map((term) => term.trim())
          .filter((term) => term.length > 0);

        if (this.autoRemoveCategoryTrailingComma) {
          // Remove any empty terms that might result from trailing commas
          // This is already handled by the filter above
        }

        if (this.autoFormatCategorySpacing) {
          // Reconstruct with proper spacing: one space after colon, one space after commas
          formattedValue = `{${categoryName.trim()}: ${terms.join(", ")}}`;
        } else {
          // Just remove trailing comma if that's the only option enabled
          formattedValue = `{${categoryName}:${termsStr.replace(/,\s*$/, "")}}`;
        }
      }

      return formattedValue;
    },

    // Filter out disabled terms from category declarations during prompt generation
    _filterDisabledCategoryTerms(value) {
      // Check if this is a category declaration
      const categoryRegex = /^{([^:}]+):\s*([^}]+)}$/;
      const match = value.match(categoryRegex);

      if (!match) {
        return value; // Not a category declaration, return unchanged
      }

      const [, categoryName, termsStr] = match;

      // Check if this is actually weight syntax (numeric value after colon)
      const isWeightSyntax = /^\s*\-?[0-9\.]+\s*$/.test(termsStr);
      if (isWeightSyntax) {
        return value; // This is weight syntax, not a category declaration
      }

      // Parse and filter out disabled terms
      const terms = termsStr.split(",").map((term) => term.trim());
      const enabledTerms = terms.filter((term) => {
        // Check if the term is disabled (wrapped in [])
        const isDisabled = term.startsWith("[") && term.endsWith("]");
        return !isDisabled;
      });

      // If no enabled terms remain, return empty string to exclude the entire category
      if (enabledTerms.length === 0) {
        return "";
      }

      // If all terms are enabled, return original value
      if (enabledTerms.length === terms.length) {
        return value;
      }

      // Reconstruct the category declaration with only enabled terms
      return `{${categoryName}: ${enabledTerms.join(", ")}}`;
    },
  },
};
</script>
