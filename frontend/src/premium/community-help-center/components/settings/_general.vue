<template>
  <div class="general">
    <el-form-item
      label="Community name"
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
      label="Community slug"
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
        <div
          class="flex items-center grow -mr-3"
          :class="{
            'justify-between': !hasPremiumPlan
          }"
        >
          <span class="font-medium">Custom domain</span>
          <span
            v-if="hasPremiumPlan"
            class="font-medium ml-2 text-purple-500"
            >{{
              FeatureFlag.premiumFeatureCopy()
            }}
            only</span
          >
          <span
            v-else
            class="flex gap-1.5 text-xs text-brand-500 hover:text-brand-700 font-normal cursor-pointer"
            @click="onUnlockClick"
          >
            <i class="ri-lock-line" />
            <span>Unlock feature</span>
          </span>
        </div>
      </template>
      <div class="w-full">
        <el-input
          v-model="computedCustomUrl"
          placeholder="https://help.crowd.dev"
          :disabled="
            !hasPremiumPlan || !hasPermissionToCustomize
          "
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
    </el-form-item>
    <app-paywall-modal
      v-model="isUpgradeModalOpen"
      module="communityHelpCenter"
    />
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  onMounted,
  ref
} from 'vue'
import { useStore } from 'vuex'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'
import config from '@/config'
import AppPaywallModal from '@/modules/layout/components/paywall-modal.vue'
import { FeatureFlag } from '@/featureFlag'

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

const hasPremiumPlan = ref(false)
const isUpgradeModalOpen = ref(false)

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

onMounted(async () => {
  const isFeatureEnabled = FeatureFlag.isFlagEnabled(
    FeatureFlag.flags.communityCenterPro
  )

  hasPremiumPlan.value =
    config.hasPremiumModules && isFeatureEnabled
})

const onUnlockClick = () => {
  isUpgradeModalOpen.value = true
}
</script>
