<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    title="Manage workspaces"
  >
    <template #content>
      <div class="flex gap-4 border-b h-8 items-center">
        <div
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide w-60"
        >
          Name
        </div>
        <div
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide flex-grow"
        >
          Plan
        </div>
      </div>
      <div
        v-for="tenant of tenants"
        :key="tenant.id"
        class="flex gap-4 items-center h-16"
      >
        <div class="w-60 font-medium text-sm">
          {{ tenant.name }}
        </div>
        <div
          class="flex items-center justify-between flex-grow gap-4"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-sm">{{
              getPlan(tenant.plan)
            }}</span>
            <span
              v-if="getTrialDate(tenant)"
              class="text-2xs text-yellow-600"
              >{{ getTrialDate(tenant) }}</span
            >
          </div>
          <button
            class="el-dropdown-link btn rounder-md hover:bg-gray-200 w-8 py-1 flex items-center justify-center"
            type="button"
            @click="handleEditClick(tenant)"
          >
            <i class="ri-pencil-line"></i>
          </button>
        </div>
      </div>
    </template>
    <template #footer>
      <router-link
        :to="{ name: 'onboard', query: { action: 'new' } }"
        ><el-button class="btn btn--md btn--primary"
          >Add workspace</el-button
        ></router-link
      >
    </template>
  </app-drawer>

  <app-dialog
    v-if="editing"
    v-model="editing"
    title="Edit workspace"
  >
    <template #content>
      <app-tenant-form
        v-if="editing"
        :record="model"
        @cancel="handleCancel"
        @success="handleSuccess"
      />
    </template>
  </app-dialog>
</template>

<script>
export default {
  name: 'TenantListDrawer'
}
</script>

<script setup>
import { useStore } from 'vuex'
import {
  defineEmits,
  defineProps,
  computed,
  ref,
  reactive
} from 'vue'
import AppTenantForm from '@/modules/tenant/components/tenant-form'
import config from '@/config'
import { getTrialDate } from '@/utils/date'

const store = useStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const editing = ref(false)
let model = reactive({})

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const tenants = computed(() => store.getters['tenant/rows'])

const handleEditClick = (tenant) => {
  Object.assign(model, tenant)
  editing.value = true
}
const handleCancel = () => {
  editing.value = false
}
const handleSuccess = () => {
  editing.value = false
  emit('update:modelValue', false)
}

const getPlan = (plan) => {
  if (config.isCommunityVersion) {
    return 'Community'
  }

  return plan
}
</script>
