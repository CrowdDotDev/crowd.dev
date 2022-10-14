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
        class="flex gap-4 border-b h-8 items-center mb-4"
      >
        <div
          class="attribute-type uppercase text-gray-400 text-2xs font-semibold tracking-wide"
        >
          Type
        </div>
        <div
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide"
        >
          Name <span class="text-brand-500">*</span>
        </div>
      </div>
      <el-form :model="model">
        <div
          v-if="!!Object.keys(model).length"
          class="flex flex-col gap-4"
        >
          <div
            v-for="(attribute, index) in model"
            :key="index"
            class="flex gap-4"
          >
            <el-form-item class="attribute-type">
              <el-select
                v-model="attribute.type"
                :disabled="attribute.canDelete"
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
              :prop="`${attribute.name}.label`"
              required
              class="grow"
            >
              <el-input
                v-model="attribute.label"
                @input="(e) => onInputChange(e, attribute)"
              ></el-input
              ><template #error>
                <div class="el-form-item__error">
                  Name is required
                </div>
              </template></el-form-item
            >
            <el-button
              class="btn btn--md btn--transparent w-10 h-10"
              @click="deleteAttribute(attribute.name)"
            >
              <i
                class="ri-delete-bin-line text-lg text-black"
              ></i>
            </el-button>
          </div>
        </div>
      </el-form>
      <el-button
        class="btn btn-link btn-link--md btn-link--primary mt-5"
        @click="addAttribute"
        >+ Add custom attribute</el-button
      >
    </template>
    <template #footer>
      <div
        class="flex w-full justify-end"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button
          v-if="hasFormChanged"
          class="btn btn-link btn-link--primary"
          @click="onReset"
          ><i class="ri-arrow-go-back-line"></i>
          <span>Reset changes</span></el-button
        >
        <div class="flex gap-4">
          <el-button
            class="btn btn--md btn--bordered"
            @click="() => (isDrawerOpen = false)"
            >Cancel</el-button
          >
          <el-button
            :disabled="!hasFormChanged"
            class="btn btn--md btn--primary"
            @click="onSubmit"
            >Update</el-button
          >
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import attributeTypes from '@/jsons/member-custom-attributes.json'
import {
  defineProps,
  defineEmits,
  computed,
  reactive
} from 'vue'
import { useStore } from 'vuex'
import isEqual from 'lodash/isEqual'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false
  }
})

const store = useStore()

// Arrays used to make the requests on form submission
const editedFields = reactive([])
const addedFields = reactive([])
const deletedFields = reactive([])

// Form models
const initialModel = reactive(
  JSON.parse(
    JSON.stringify(
      Object.values(store.state.member.customAttributes)
        .filter(
          (attribute) =>
            attribute.canDelete && attribute.show
        )
        .reduce(
          (obj, attribute) => ({
            ...obj,
            [attribute.name]: attribute
          }),
          {}
        )
    )
  )
)
const model = reactive(
  JSON.parse(JSON.stringify(initialModel))
)

const hasFormChanged = computed(() => {
  return !isEqual(initialModel, model)
})
const isDrawerOpen = computed({
  get() {
    return props.modelValue
  },
  set(drawerVisibility) {
    emit('update:modelValue', drawerVisibility)
  }
})

async function onSubmit() {
  let hasErrorOccurred = false
  // Handle deleted fields
  if (deletedFields.length) {
    try {
      // Show confirmation modal before deleting attributes
      await ConfirmDialog({
        type: 'error',
        title: 'Deleting custom attributes in use',
        message:
          'Deleting custom attributes will also discard any associated values. \n Are you sure you want to proceed?',
        confirmButtonText: 'Confirm update'
      })

      const ids = deletedFields.map(
        (deletedField) => deletedField.id
      )

      store
        .dispatch('member/doDestroyCustomAttributes', ids)
        .catch(() => {
          hasErrorOccurred = true
        })
    } catch (e) {
      return
    }
  }

  // Handle added fields
  if (addedFields.length) {
    addedFields.forEach(async ({ type, label }) => {
      try {
        await store.dispatch(
          'member/doCreateCustomAttributes',
          {
            type,
            label
          }
        )
      } catch (e) {
        hasErrorOccurred = true
      }
    })
  }

  // Handle edited fields
  if (editedFields.length) {
    editedFields.forEach(async ({ id, label }) => {
      try {
        await store.dispatch(
          'member/doUpdateCustomAttributes',
          {
            id,
            data: {
              label
            }
          }
        )
      } catch (e) {
        hasErrorOccurred = true
      }
    })
  }

  if (hasErrorOccurred) {
    Message.error(i18n('errors.defaultErrorMessage'))
  } else {
    Message.success(
      i18n('entities.member.attributes.success')
    )
    isDrawerOpen.value = false
  }
}

function onInputChange(newValue, attribute) {
  // Logic for edited attributes
  if (
    model[attribute.name].canDelete &&
    newValue !== initialModel[attribute.name]?.label &&
    !editedFields.some(
      (field) => field.name === attribute.name
    )
  ) {
    editedFields.push(model[attribute.name])
  } else if (
    model[attribute.name].canDelete &&
    newValue === initialModel[attribute.name]?.label
  ) {
    const id = editedFields.findIndex(
      (field) => field.name === attribute.name
    )
    editedFields.splice(id, 1)
  }
}

function onReset() {
  addedFields.splice(0)
  editedFields.splice(0)
  deletedFields.splice(0)

  Object.assign(
    model,
    JSON.parse(JSON.stringify(initialModel))
  )
}

function addAttribute() {
  const newAttribute = {
    name: Date.now(),
    type: 'string',
    label: null
  }

  addedFields.push(newAttribute)
  model[newAttribute.name] = newAttribute
}

function deleteAttribute(key) {
  if (
    model[key].canDelete &&
    !deletedFields.some((field) => field.name === key)
  ) {
    deletedFields.push(model[key])
  } else {
    const id = addedFields.findIndex((a) => a.name === key)

    if (id) {
      addedFields.splice(id, 1)
    }
  }

  delete model[key]
}
</script>

<style lang="scss">
.member-attributes-drawer {
  & .el-drawer__header {
    @apply p-6 m-2;
  }

  & .el-drawer__body {
    @apply px-6 py-0;
  }

  & .el-drawer__footer {
    @apply p-6 border-t border-gray-200;
  }

  & .attribute-type {
    width: 100px;
  }

  & .el-form-item,
  .el-form .el-form-item__content {
    @apply mb-0;
  }
}
</style>
