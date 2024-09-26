<template>
  <div class="flex items-center">
    <lf-avatar
      :name="props.entity.displayName"
      :src="avatar(props.entity)"
      :size="24"
      class="!rounded-md border border-gray-200 min-w-6"
      img-class="!object-contain"
    >
      <template #placeholder>
        <div class="w-full h-full bg-gray-50 flex items-center justify-center">
          <lf-icon name="community-line" :size="16" class="text-gray-400" />
        </div>
      </template>
    </lf-avatar>
    <p class="text-medium pl-3">
      {{ props.entity.displayName }}
    </p>
  </div>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';

const props = defineProps<{
  attribute: any,
  entity: Contributor,
}>();

const { avatar } = useContributorHelpers();
</script>
