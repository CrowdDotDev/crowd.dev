<template>
  <div
    class="el-select el-keywords-input-wrapper"
    @click="focusKeywordInput"
    :class="focused ? 'el-input is-focus' : ''"
  >
    <transition-group>
      <el-tag
        v-for="(keyword, idx) in innerKeywords"
        v-bind="$attrs"
        :key="keyword"
        size="small"
        type="info"
        effect="light"
        :closable="!readOnly"
        :disable-transitions="false"
        @close="remove(idx)"
      >
        {{ keyword }}
      </el-tag>
    </transition-group>
    <input
      v-if="!readOnly"
      class="el-keywords-input"
      :placeholder="placeholder"
      @input="inputKeyword"
      :value="newKeyword"
      @keydown.delete.stop="removeLastKeyword"
      @keydown="addNew"
      @blur="addNew"
    />
  </div>
</template>

<script>
export default {
  name: 'AppKeywordsInput',
  props: {
    value: {
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
    placeholder: String
  },
  data() {
    return {
      newKeyword: '',
      innerKeywords: [...this.value],
      focused: false
    }
  },
  watch: {
    value() {
      this.innerKeywords = [...this.value]
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
      }
      this.focused = false
    },
    inputKeyword(ev) {
      this.newKeyword = ev.target.value
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
      this.$emit('input', this.innerKeywords)
    }
  }
}
</script>

<style lang="scss">
.el-keywords-input-wrapper {
  @apply relative text-sm bg-white rounded-md pr-2 pl-1 leading-loose;
  background-image: none;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  color: #606266;
  outline: none;
  transition: border-color 0.2s
    cubic-bezier(0.645, 0.045, 0.355, 1);
}

.el-keywords-input {
  @apply bg-transparent border-none pl-0 ml-2 leading-loose h-10;
  font-size: inherit;
  outline: none;
  width: 200px;
}
</style>
