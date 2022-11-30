<template>
  <div class="app-keywords-input">
    <div
      class="el-keywords-input-wrapper"
      :class="focused ? 'is-focus' : ''"
      @click="focusKeywordInput"
    >
      <el-tag
        v-for="(keyword, idx) in innerKeywords"
        v-bind="$attrs"
        :key="keyword"
        type="info"
        effect="light"
        :disable-transitions="true"
        :closable="!readOnly"
        @close="remove(idx)"
      >
        {{ keyword }}
      </el-tag>
      <input
        v-if="!readOnly"
        class="el-keywords-input"
        :placeholder="placeholder"
        :value="newKeyword"
        autocomplete="off"
        data-lpignore="true"
        @input="inputKeyword"
        @keydown.delete.stop="removeLastKeyword"
        @keydown="addNew"
        @focus="focus"
        @blur="blur"
      />
    </div>
    <span
      class="helper-copy"
      :class="focused ? 'opacity-100' : 'opacity-0'"
      >Press ENTER or comma (,) to separate keywords</span
    >
  </div>
</template>

<script>
export default {
  name: 'AppKeywordsInput',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    addKeywordOnKeys: {
      type: Array,
      default: () => [13, 188, 9]
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      newKeyword: '',
      innerKeywords: [...this.modelValue],
      focused: false
    }
  },
  watch: {
    modelValue() {
      this.innerKeywords = [...this.modelValue]
    }
  },
  methods: {
    focusKeywordInput() {
      if (
        this.readOnly ||
        !this.$el.querySelector('.el-keywords-input')
      ) {
        return
      } else {
        this.$el.querySelector('.el-keywords-input').focus()
        this.focused = true
      }
    },
    inputKeyword(ev) {
      this.newKeyword = ev.target.value
    },
    blur(e) {
      this.focused = false
      this.addNew(e)
    },
    focus() {
      this.focused = true
    },
    addNew(e) {
      if (
        e &&
        !this.addKeywordOnKeys.includes(e.keyCode) &&
        e.type !== 'blur'
      ) {
        return
      }
      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }
      let addSuccess = false
      if (this.newKeyword.includes(',')) {
        this.newKeyword.split(',').forEach((item) => {
          if (this.addKeyword(item.trim())) {
            addSuccess = true
          }
        })
      } else {
        if (this.addKeyword(this.newKeyword.trim())) {
          addSuccess = true
        }
      }
      if (addSuccess) {
        this.keywordChange()
        this.newKeyword = ''
      }
    },
    addKeyword(keyword) {
      keyword = keyword.trim()
      if (
        keyword &&
        !this.innerKeywords.includes(keyword)
      ) {
        this.innerKeywords.push(keyword)
        return true
      }
      return false
    },
    remove(index) {
      this.innerKeywords.splice(index, 1)
      this.keywordChange()
    },
    removeLastKeyword() {
      if (this.newKeyword) {
        return
      }
      this.innerKeywords.pop()
      this.keywordChange()
    },
    keywordChange() {
      this.$emit('update:modelValue', this.innerKeywords)
    }
  }
}
</script>

<style lang="scss">
.app-keywords-input {
  @apply w-full;

  .el-keywords-input-wrapper {
    @apply relative text-sm bg-white shadow-none border border-solid border-gray-300 rounded-md pr-2 pl-1 flex items-center flex-wrap;
    background-image: none;
    box-sizing: content-box;
    outline: none;
    transition: border-color 0.2s
      cubic-bezier(0.645, 0.045, 0.355, 1);
    min-height: 38px;

    .el-tag {
      margin: 4px 0 4px 4px;
    }

    &.is-focus {
      @apply border-gray-500;
    }

    &:hover:not(:focus):not(.is-focus) {
      @apply border-gray-400;
    }
  }

  .el-keywords-input {
    @apply bg-transparent border-none pl-0 ml-2 h-full text-gray-900;
    font-size: inherit;
    outline: none;
    width: 400px;
    min-height: 24px;
  }
  .el-tag--small .el-tag__close {
    @apply ml-1.5;
  }

  &.is-focus {
    border: 1px solid #0068bd;
  }

  .el-tag.el-tag--info {
    @apply text-black;
  }

  .el-keywords-input-list {
    @apply flex items-center flex-wrap h-full;
  }

  .helper-copy {
    @apply text-xs text-gray-400;
  }
}
</style>
