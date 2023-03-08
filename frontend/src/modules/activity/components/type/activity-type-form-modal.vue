<template>
  <app-dialog
    v-model="isVisible"
    :title="
      isEdit ? 'Edit activity type' : 'New activity type'
    "
  >
    <template #content>
      <section class="px-6 pb-10">
        <div class="flex -mx-1.5">
          <div class="w-1/3 px-1.5">
            <app-form-item
              class="mb-4"
              label="Platform"
              :validation="$v.platform"
              :required="true"
              :error-messages="{
                required: 'This field is required'
              }"
            >
              <el-select
                v-model="form.platform"
                placeholder="Select option"
                class="w-full"
              >
                <template
                  v-if="
                    selectedPlatform ||
                    form.platform === 'other'
                  "
                  #prefix
                >
                  <img
                    v-if="selectedPlatform"
                    :src="selectedPlatform.image"
                    :alt="selectedPlatform.name"
                    class="w-4 h-4"
                  />
                  <i
                    v-else-if="form.platform === 'other'"
                    class="ri-radar-line text-base text-gray-400 h-4 flex items-center"
                  ></i>
                </template>
                <el-option
                  v-for="platform in platforms"
                  :key="platform.platform"
                  :value="platform.platform"
                  :label="platform.name"
                >
                  <div class="flex items-center">
                    <img
                      :src="platform.image"
                      :alt="platform.name"
                      class="w-4 h-4 mr-3"
                    />
                    <span>{{ platform.name }}</span>
                  </div>
                </el-option>
                <el-option value="other" label="Other">
                  <div class="flex items-center">
                    <i
                      class="ri-radar-line text-base text-gray-400 mr-3 h-4 flex items-center"
                    ></i>
                    <span>Other</span>
                  </div>
                </el-option>
              </el-select>
            </app-form-item>
          </div>
          <div
            v-if="form.platform === 'other'"
            class="w-2/3 px-1.5"
          >
            <app-form-item class="mb-4">
              <el-input
                v-model="form.platformName"
                placeholder="Enter name"
                class="mt-6"
              >
              </el-input>
            </app-form-item>
          </div>
        </div>
        <app-form-item
          class="mb-2"
          label="Type name"
          :validation="$v.name"
          :required="true"
          :error-messages="{
            required: 'This field is required'
          }"
        >
          <el-input v-model="form.name"> </el-input>
        </app-form-item>
        <p class="text-2xs text-gray-500 leading-5">
          Example: Attended
          <span v-pre>{{ platform }}</span> conference.
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
          v-if="isEdit"
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
import { CrowdIntegrations } from '@/integrations/integrations-config'
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
  platform: '',
  platformName: '',
  name: ''
})

const rules = {
  platform: {
    required
  },
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

// Platforms data
const platforms = computed(() => {
  return CrowdIntegrations.enabledConfigs
})
const selectedPlatform = computed(() => {
  return CrowdIntegrations.getConfig(form.platform)
})

const submit = () => {}
</script>
