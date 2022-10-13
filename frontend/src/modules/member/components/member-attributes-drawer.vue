<template>
  <el-drawer
    v-model="isDrawerOpen"
    custom-class="member-attributes-drawer"
    direction="rtl"
    size="35%"
    @closed="() => (isDrawerOpen = false)"
  >
    <template #title>
      <h5 class="text-black">Manage custom attributes</h5>
    </template>
    <template #default>
      <div
        v-if="!!customAttributes.length"
        class="custom-attributes-form flex mt-4 mb-2 flex-col gap-4"
      >
        <div
          v-for="(attribute, index) in customAttributes"
          :key="index"
          class="flex gap-4"
        >
          <el-form-item class="attributeType">
            <el-select
              v-model="attribute.type"
              disabled
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
            :prop="attribute.name"
            required
            class="grow"
          >
            <el-input v-model="attribute.label"></el-input
            ><template #error>
              <div class="el-form-item__error">
                Name is required
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
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-4">
        <el-button
          class="btn btn--md btn--bordered"
          @click="() => emit('onCancel')"
          >Cancel</el-button
        >
        <el-button
          :disabled="isSubmitEnabled"
          class="btn btn--md btn--primary"
          @click="() => emit('onSubmit')"
          >Update</el-button
        >
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import attributeTypes from '@/jsons/member-custom-attributes.json'
import { defineProps, defineEmits, computed } from 'vue'

const emit = defineEmits([
  'update:modelValue',
  'onCancel',
  'onSubmit'
])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false
  },
  attributes: {
    type: Array,
    default: () => []
  }
})

const customAttributes = computed(() =>
  props.attributes.filter(
    (attribute) => attribute.canDelete
  )
)
const isSubmitEnabled = computed(() => false)
const isDrawerOpen = computed({
  get() {
    return props.modelValue
  },
  set(drawerVisibility) {
    emit('update:modelValue', drawerVisibility)
  }
})
</script>

<style lang="scss">
.member-attributes-drawer {
  & .el-drawer__header {
    @apply p-6 m-2;
  }

  & .el-drawer__footer {
    @apply p-6 border-t border-gray-200;
  }

  & .attributeType {
    width: 100px;
  }
}
</style>
