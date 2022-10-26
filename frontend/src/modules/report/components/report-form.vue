<template>
  <div>
    <el-form
      v-if="record"
      ref="form"
      :model="model"
      :rules="rules"
      class="report-form"
    >
      <el-input
        ref="focus"
        v-model="model[fields.name.name]"
        :placeholder="fields.name.placeholder"
        class="report-form-title"
      />
      <ReportGridLayout
        v-model="model"
        :editable="true"
        class="-mx-4 -mt-4"
      />
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'AppReportForm'
}
</script>
<script setup>
import { defineProps, reactive, watch } from 'vue'
import { mapActions } from '@/shared/vuex/vuex.helpers'
import { FormSchema } from '@/shared/form/form-schema'
import { ReportModel } from '@/modules/report/report-model'
import ReportGridLayout from './report-grid-layout'
import debounce from 'lodash/debounce'

const props = defineProps({
  record: {
    type: Object,
    default: () => {}
  }
})

const { fields } = ReportModel
const formSchema = new FormSchema([
  fields.name,
  fields.widgets,
  fields.settings,
  fields.public
])

const rules = formSchema.rules()
const model = reactive(
  JSON.parse(JSON.stringify(props.record))
)

const { doUpdate } = mapActions('report')

const debouncedChange = debounce(async () => {
  await doUpdate({
    id: props.record && props.record.id,
    values: formSchema.cast(model)
  })
}, 1000)

watch(model, () => {
  debouncedChange()
})
</script>

<style lang="scss">
.report-form {
  &-title {
    @apply h-16 mb-6;
    .el-input__wrapper {
      @apply rounded-none border-0 border-b border-gray-200 py-6 text-lg font-semibold bg-transparent w-full px-0 shadow-none ring-0;
      transition: all 0.2s ease;

      &:hover {
        @apply bg-gray-100 border-gray-300;
      }

      &.is-focus,
      &:focus,
      &:active {
        @apply border-gray-300 outline-none shadow-none;
      }
    }
  }
}
</style>
