<template>
  <article class="border-b border-gray-100 py-5 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <template v-for="(member, mi) of props.suggestion.members" :key="member.id">
        <div v-if="mi > 0">
          <lf-icon name="subtract-line" :size="24" class="text-gray-400" />
        </div>
        <div class="flex items-center gap-3">
          <lf-avatar
            :src="member.avatarUrl"
            :name="member.displayName"
            :size="32"
          />
          <p class="text-medium font-semibold">
            {{ member.displayName }}
          </p>
        </div>
      </template>
      <lf-badge type="primary" size="small">
        <span class="font-semibold mr-1">Merge suggestion</span>
        <span>{{ Math.round(props.suggestion.similarity * 100) }}% confidence</span>
      </lf-badge>
    </div>
    <slot name="action" />
  </article>
</template>

<script lang="ts" setup>
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';

const props = defineProps<{
  suggestion: any,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMemberMergeSuggestionsItem',
};
</script>
