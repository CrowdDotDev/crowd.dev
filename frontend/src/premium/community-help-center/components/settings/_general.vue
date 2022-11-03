<template>
  <div class="general">
    <el-form-item
      label="Community Name"
      prop="tenantName"
      :required="true"
      class="w-full"
    >
      <el-input
        v-model="computedTenantName"
        placeholder="Crowd.dev"
      />
      <div class="app-form-hint">
        Display name of your community/company
      </div>
    </el-form-item>
    <el-form-item
      label="Community Slug"
      prop="tenantSlug"
      :required="true"
      class="w-full"
    >
      <el-input
        v-model="computedTenantSlug"
        :readonly="publishedConversations.length > 0"
        placeholder="crowd-dev"
      />
      <div class="app-form-hint">
        Unique identifier —
        <strong>can't be changed</strong>
      </div>
    </el-form-item>
    <el-form-item prop="customUrl" class="w-full">
      <template #label>
        <div class="flex items-center">
          <span class="font-medium">Custom URL</span>
          <span class="font-medium ml-2 text-purple-500"
            >Premium only</span
          >
        </div>
      </template>
      <div v-if="hasPermissionToCustomize">
        <el-input
          v-model="computedCustomUrl"
          placeholder="https://help.crowd.dev"
        />
        <div class="app-form-hint">
          Custom domain/url for the help center —
          <a
            href="https://docs.crowd.dev/docs/conversations#4-set-up-custom-domain-premium-only"
            target="_blank"
            class="font-semibold"
            >see docs</a
          >
        </div>
      </div>
      <div v-else class="text-gray-500 text-2xs">
        To customize the URL of your Community Help Center,
        you need to switch to a paid plan
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { useStore } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'

const store = useStore()

const props = defineProps({
  tenantName: {
    type: String,
    default: null
  },
  tenantSlug: {
    type: String,
    default: null
  },
  customUrl: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:tenantName',
  'update:tenantSlug',
  'update:customUrl'
])

const computedTenantName = computed({
  get() {
    return props.tenantName
  },
  set(value) {
    emit('update:tenantName', value)
  }
})

const computedTenantSlug = computed({
  get() {
    return props.tenantSlug
  },
  set(value) {
    emit('update:tenantSlug', value)
  }
})

const computedCustomUrl = computed({
  get() {
    return props.customUrl
  },
  set(value) {
    emit('update:customUrl', value)
  }
})

const publishedConversations = computed(
  () => store.getters['communityHelpCenter/publishedRows']
)

const hasPermissionToCustomize = computed(() => {
  return new ConversationPermissions(
    store.getters['auth/currentTenant'],
    store.getters['auth/currentUser']
  ).customize
})
</script>
