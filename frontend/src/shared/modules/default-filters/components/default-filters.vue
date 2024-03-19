<template>
  <span class="text-gray-500 text-sm"> {{ copy }}</span>
</template>

<script setup lang="ts">
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import { computed } from 'vue';
import config from '../config/index';

const props = defineProps<{
    module: 'member' | 'organization',
    settings: {
      teamMember?: IncludeEnum;
      teamOrganization?: IncludeEnum;
      bot?: IncludeEnum;
    };
}>();

const copy = computed(() => config[props.module].copy(props.settings));
</script>
