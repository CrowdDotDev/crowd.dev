<template>
  <el-select v-model="model" placeholder="Select an option">
    <el-option
      v-for="(item,
      index) in fields.scoreRange.dropdownOptions()"
      :key="index"
      :label="item.label"
      :value="item.value"
    >
    </el-option>
  </el-select>
</template>

<script>
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'

const { fields } = CommunityMemberModel

export default {
  name: 'app-community-member-engagement-level-filter',
  props: ['value'],
  computed: {
    fields() {
      return fields
    }
  },
  data() {
    return {
      model: this.value ? this.value.join('-') : null
    }
  },
  watch: {
    model: {
      handler(newValue) {
        this.$emit('input', newValue.split('-'))
      }
    }
  }
}
</script>
