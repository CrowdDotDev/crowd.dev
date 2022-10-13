<template>
  <div class="grid gap-x-12 grid-cols-3 mb-16">
    <div>
      <h6>Custom attributes</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Add custom data points to enhance the member profile
      </p>
    </div>
    <div class="col-span-2">
      <div
        class="grid grid-cols-12 gap-3 border-b h-8 items-center"
      >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-2"
          >Type</span
        >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-5"
          >Name</span
        >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-5"
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
          <el-form-item class="col-span-2">
            <el-select
              v-model="attribute.type"
              popper-class="attribute-popper-class"
              placeholder="Type"
              size="large"
            >
              <el-option
                v-for="typeOption in attributeTypes"
                :key="typeOption.value"
                :label="typeOption.label"
                :value="typeOption.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            :prop="`customAttributes.${camelCase(
              attribute.label
            )}`"
            required
            class="col-span-5"
          >
            <el-input v-model="attribute.label"></el-input
            ><template #error>
              <div class="el-form-item__error">
                Name is required
              </div>
            </template></el-form-item
          >
          <el-form-item
            required
            :prop="`customAttributes.${camelCase(
              attribute.label
            )}.custom`"
            class="col-span-4"
            ><el-input v-model="attribute.value"></el-input
            ><template #error>
              <div class="el-form-item__error">
                Value is required
              </div>
            </template></el-form-item
          >
          <el-button
            class="btn btn--md btn--transparent w-10 h-10"
            @click="deleteAttribute(index)"
          >
            <i
              class="ri-delete-bin-line text-lg text-black"
            ></i>
          </el-button>
        </div>
      </div>
      <el-button
        class="btn btn-link btn-link--md btn-link--primary mt-4"
        @click="addAttribute"
        >+ Add custom attribute</el-button
      >
    </div>
  </div>
</template>

<script setup>
import attributeTypes from '@/jsons/member-custom-attributes.json'
import camelCase from 'lodash/camelCase'
import {
  defineProps,
  defineEmits,
  computed,
  ref,
  watch
} from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  record: {
    type: Object,
    default: () => {}
  },
  modelValue: {
    type: Object,
    default: () => {}
  }
})

const customAttributes = ref([])

const member = computed(() => props.record)
const model = computed({
  get() {
    return props.modelValue
  },
  set(newModel) {
    emit('update:modelValue', newModel)
  }
})

watch(member, (newMember) => {
  const defaultAttributes = [
    'jobTitle',
    'url',
    'bio',
    'location'
  ]

  Object.entries(newMember.attributes).forEach(
    ([key, value]) => {
      if (!defaultAttributes.includes(key)) {
        customAttributes.value.push({
          type: 'string',
          label: key,
          value: value.custom
        })
      }
    }
  )
})

watch(customAttributes.value, (attributes) => {
  if (!attributes.length) {
    delete model.value.customAttributes
    return
  }

  model.value.customAttributesArray = attributes
  model.value.customAttributes = attributes.reduce(
    (obj, { label, value }) => ({
      ...obj,
      [camelCase(label)]: { custom: value }
    }),
    {}
  )
})

function addAttribute() {
  customAttributes.value.push({
    type: 'string',
    label: null,
    value: null
  })
}

function deleteAttribute(index) {
  customAttributes.value.splice(index, 1)
}
</script>
