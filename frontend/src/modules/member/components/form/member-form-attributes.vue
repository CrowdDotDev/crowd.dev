<template>
  <div class="grid gap-x-12 grid-cols-3 mb-16">
    <div v-if="showHeader">
      <h6>Custom attributes</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Add custom data points to enhance the member profile
      </p>
      <el-button
        class="btn btn-link btn-link--sm btn-link--primary mt-3"
        @click="() => emit('openDrawer')"
        >Manage global attributes</el-button
      >
    </div>
    <div :class="showHeader ? 'col-span-2' : 'col-span-3'">
      <div
        class="grid grid-cols-12 gap-3 border-b h-8 items-center"
      >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-4"
          >Name</span
        >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-8"
          >Value</span
        >
      </div>
      <div
        v-if="!!customAttributes.length"
        class="custom-attributes-form flex mt-4 mb-2 flex-col gap-4"
      >
        <div
          v-for="(attribute, index) in customAttributes"
          :key="index"
          class="grid grid-cols-12 gap-3"
        >
          <div
            class="col-span-4 flex flex-col gap-1 justify-center"
          >
            <div class="flex items-center leading-tight">
              <div
                class="text-gray-900 text-xs font-medium mr-2"
              >
                {{ attribute.label }}
              </div>
              <el-tooltip
                v-if="
                  model.attributes[attribute.name]
                    ?.enrichment
                "
                content="Member enrichment"
                placement="top"
              >
                <div class="form-enrichment-badge">
                  <app-svg name="enrichment" />
                </div>
              </el-tooltip>
            </div>
            <span
              class="text-2xs text-gray-500 leading-none"
              >{{ attributesTypes[attribute.type] }}</span
            >
          </div>
          <el-form-item class="col-span-8">
            <el-date-picker
              v-if="attribute.type === 'date'"
              v-model="model[attribute.name]"
              :prefix-icon="CalendarIcon"
              :clearable="false"
              class="custom-date-picker"
              popper-class="date-picker-popper"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              placeholder="YYYY-MM-DD"
            />
            <el-select
              v-else-if="attribute.type === 'boolean'"
              v-model="model[attribute.name]"
              class="w-full"
              clearable
              placeholder="Select option"
            >
              <el-option
                key="true"
                label="True"
                :value="true"
                @mouseleave="onSelectMouseLeave"
              />
              <el-option
                key="false"
                label="False"
                :value="false"
                @mouseleave="onSelectMouseLeave"
              />
            </el-select>

            <el-tooltip
              v-else-if="attribute.type === 'multiSelect'"
              content="Multi-select fields are temporarily read-only"
              placement="top"
            >
              <el-select
                v-model="model[attribute.name]"
                class="w-full"
                disabled
                filterable
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="Select option"
              >
                <el-option
                  v-for="item of attribute.options"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-tooltip>
            <el-input
              v-else
              v-model="model[attribute.name]"
              :type="attribute.type"
              clearable
            ></el-input
            ><template #error>
              <div class="el-form-item__error">
                Value is required
              </div>
            </template></el-form-item
          >
        </div>
      </div>
      <div
        v-else
        class="text-gray-500 text-xs italic mt-4 mb-2"
      >
        No attributes available
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  h,
  watch
} from 'vue'
import { onSelectMouseLeave } from '@/utils/select'
import AppSvg from '@/shared/svg/svg'

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400'
  }, // props
  []
)

const attributesTypes = {
  string: 'Text',
  number: 'Number',
  email: 'E-mail',
  url: 'URL',
  date: 'Date',
  boolean: 'Boolean',
  multiSelect: 'Multi-select'
}

const emit = defineEmits([
  'update:modelValue',
  'openDrawer'
])
const props = defineProps({
  attributes: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Object,
    default: () => {}
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  record: {
    type: Object,
    default: () => {}
  }
})

const customAttributes = computed(() =>
  props.attributes
    .filter((attribute) => {
      return (
        attribute.show &&
        ![
          'bio',
          'url',
          'location',
          'jobTitle',
          'emails',
          'workExperiences', // we render them in _aside-enriched
          'certifications', // we render them in _aside-enriched
          'education', // we render them in _aside-enriched
          'awards' // we render them in _aside-enriched
        ].includes(attribute.name) &&
        props.record.attributes[attribute.name]
      )
    })
    .sort((a, b) => {
      if (props.record.attributes[a.name].enrich) {
        return props.record.attributes[b.name].enrich
          ? 0
          : -1
      } else {
        return 1
      }
    })
)

const model = computed(() => props.modelValue)

watch(model.value, (newModel) => {
  emit('update:modelValue', newModel)
})
</script>

<style lang="scss">
.form-enrichment-badge {
  @apply w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center;
  svg {
    @apply h-4 w-4 overflow-visible flex items-center justify-center leading-none;
  }
}
</style>
