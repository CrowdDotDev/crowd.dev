<template>
  <article class="border-b border-gray-100 py-5 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <template v-for="(organization, mi) of props.suggestion.organizations" :key="organization.id">
        <div v-if="mi > 0">
          <lf-icon-old name="arrow-left-line" :size="16" class="text-gray-400" />
        </div>
        <div class="flex items-center gap-3">
          <lf-avatar
            :src="organization.logo"
            :name="organization.displayName"
            :size="32"
          >
            <template #placeholder>
              <div class="w-full h-full bg-gray-50 flex items-center justify-center">
                <lf-icon-old name="community-line" :size="16" class="text-gray-400" />
              </div>
            </template>
          </lf-avatar>
          <p class="text-medium font-semibold truncate" style="max-width: 30ch">
            {{ organization.displayName }}
          </p>
        </div>
      </template>
      <div class="flex gap-2">
        <lf-badge type="primary" size="small" class="!font-semibold">
          Merge suggestion
        </lf-badge>
        <app-member-merge-similarity :similarity="+props.suggestion.similarity" percentage-only />
      </div>
    </div>
    <slot name="action" />
  </article>
</template>

<script lang="ts" setup>
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import AppMemberMergeSimilarity from '@/modules/member/components/suggestions/member-merge-similarity.vue';

const props = defineProps<{
  suggestion: any,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityOrganizationMergeSuggestionsItem',
};
</script>
