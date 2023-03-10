<template>
  <app-dialog
    v-model="isVisible"
    :title="
      isEdit ? 'Edit activity type' : 'New activity type'
    "
  >
    <template #content>
      <section class="px-6 pb-10">
        <app-form-item
          class="mb-2"
          label="Activity type"
          :validation="$v.name"
          :required="true"
          :error-messages="{
            required: 'This field is required'
          }"
        >
          <el-input v-model="form.name"> </el-input>
        </app-form-item>
        <p
          v-if="form.platform === 'other'"
          class="text-2xs text-gray-500 leading-5"
        >
          Example: "Registered to conference"
        </p>
      </section>
      <footer
        class="bg-gray-50 py-4 px-6 flex justify-end rounded-b-md"
      >
        <el-button
          class="btn btn--bordered btn--md mr-4"
          @click="emit('update:modelValue', false)"
          >Cancel</el-button
        >
        <el-button
          class="btn btn--primary btn--md"
          @click="submit()"
        >
          <span v-if="isEdit">Update</span>
          <span v-else>Add activity type</span>
        </el-button>
      </footer>
    </template>
  </app-dialog>
</template>

<script>
export default {
  name: 'AppActivityTypeFormModal'
}
</script>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  reactive
} from 'vue'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import AppFormItem from '@/shared/form/form-item.vue'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Form control
const form = reactive({
  name: ''
})

const rules = {
  name: {
    required
  }
}

const $v = useVuelidate(rules, form)

// is modal visible
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => {
  // TODO: is it edit / create
  return false
})

const submit = () => {}
</script>
