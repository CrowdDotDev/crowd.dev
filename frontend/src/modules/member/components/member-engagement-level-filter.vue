<template>
  <el-select v-model="model" placeholder="Select an option">
    <el-option
      v-for="(
        item, index
      ) in fields.scoreRange.dropdownOptions()"
      :key="index"
      :label="item.label"
      :value="item.value"
    >
    </el-option>
  </el-select>
</template>

<script>
import { MemberModel } from '@/modules/member/member-model'

const { fields } = MemberModel

export default {
  name: 'AppMemberEngagementLevelFilter',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      model: this.value ? this.value.join('-') : null
    }
  },
  computed: {
    fields() {
      return fields
    }
  },
  watch: {
    model: {
      handler(newValue) {
        this.$emit('update:modelValue', newValue.split('-'))
      }
    }
  }
}
</script>
