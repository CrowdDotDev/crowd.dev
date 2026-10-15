<template>
  <lf-popover trigger-event="hover" placement="top" is-dropdown>
    <template #trigger>
      <span class="relative flex items-center justify-center h-8 w-8">
        <lf-icon :name="icon" :size="16" :class="iconColor" />
        <lf-icon
          v-if="isStale"
          name="circle"
          type="solid"
          :size="8"
          class="absolute top-1.5 right-1.5 text-[#FE9A00]"
        />
      </span>
    </template>

    <div
      class="w-[280px] flex flex-col gap-3 p-3 bg-white rounded-lg border border-gray-100
        shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)]"
    >
      <p class="text-xs leading-[14px] text-gray-400">
        Verification status
      </p>

      <div class="flex items-center gap-2">
        <lf-icon :name="icon" :size="20" :class="iconColor" />
        <p class="text-sm leading-[14px] font-semibold text-gray-900">
          {{ title }}
        </p>
      </div>

      <template v-if="description">
        <div class="border-t border-gray-100" />
        <p class="text-xs text-[#62748E]">
          {{ description }}
        </p>
      </template>

      <div class="border-t border-gray-100" />

      <div class="flex flex-col gap-2 text-xs">
        <div v-if="status === 'verified'" class="flex items-center justify-between gap-3">
          <span class="text-[#62748E]">Verified by:</span>
          <span class="flex items-center gap-1.5 text-gray-900 min-w-0">
            <lf-avatar :name="entity.verifiedBy ?? ''" :size="20" />
            <span class="truncate">{{ entity.verifiedBy }}</span>
          </span>
        </div>
        <div v-else-if="status === 'auto-verified'" class="flex items-center justify-between gap-3">
          <span class="text-[#62748E]">Verified by:</span>
          <span class="text-gray-900">LFX platform</span>
        </div>
        <div v-if="status !== 'unverified' && verifiedOn" class="flex items-center justify-between gap-3">
          <span class="text-[#62748E]">Verified on:</span>
          <span class="text-gray-900">{{ formatVerificationDate(verifiedOn) }}</span>
        </div>
        <div v-if="kind === 'work-experience' && source" class="flex items-center justify-between gap-3">
          <span class="text-[#62748E]">Source:</span>
          <span class="flex items-center gap-1.5 text-gray-900">
            <lf-icon v-if="source.icon" :name="source.icon" :size="16" class="text-[#62748E]" />
            <img v-else-if="source.image" :src="source.image" :alt="source.label" class="h-4 w-4">
            {{ source.label }}
          </span>
        </div>
        <div v-if="entity.updatedAt" class="flex items-center justify-between gap-3">
          <span class="text-[#62748E]">Last updated:</span>
          <span class="text-gray-900">{{ formatVerificationDate(entity.updatedAt) }}</span>
        </div>
      </div>

      <div v-if="isStale" class="flex items-start gap-2">
        <lf-icon name="exclamation-circle" type="solid" :size="16" class="text-[#FE9A00]" />
        <p class="text-xs text-[#E17100]">
          This identity was updated after it was last verified. It's worth re-checking.
        </p>
      </div>
    </div>
  </lf-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfPopover from '@/ui-kit/popover/Popover.vue';
import {
  formatVerificationDate,
  getVerificationSource,
  getVerificationStatus,
  getVerifiedOn,
  isUpdatedAfterVerification,
  type VerificationEntity,
  type VerificationKind,
} from '@/shared/modules/verification/verification.helpers';

defineOptions({ name: 'LfVerificationStatus' });

const props = defineProps<{
  entity: VerificationEntity,
  kind: VerificationKind,
}>();

const status = computed(() => getVerificationStatus(props.entity));
const isStale = computed(() => isUpdatedAfterVerification(props.entity, props.kind));
const verifiedOn = computed(() => getVerifiedOn(props.entity));
const source = computed(() => getVerificationSource(props.entity));

const icon = computed(() => (status.value === 'unverified' ? 'circle-dashed' : 'circle-check'));

const iconColor = computed(() => ({
  unverified: 'text-[#90A1B9]',
  verified: 'text-[#00BC7D]',
  'auto-verified': 'text-[#009AFF]',
}[status.value]));

const title = computed(() => ({
  unverified: 'Unverified',
  verified: 'Verified',
  'auto-verified': 'Auto-verified',
}[status.value]));

const description = computed(() => {
  if (status.value === 'auto-verified') {
    return 'This identity has been automatically verified by the LFX platform '
      + 'because it came through a connected data source.';
  }
  if (status.value === 'unverified') {
    return props.kind === 'work-experience'
      ? 'This work experience has not yet been verified by our team.'
      : 'This identity has not yet been verified by our team or automatically by the LFX platform.';
  }
  return '';
});

</script>
