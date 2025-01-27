<template>
  <article
    class="border-gray-200  flex items-center"
    :class="{
      'border-t first:border-none py-2.5': !module,
    }"
  >
    <div
      :class="{
        'w-5/12': !module && platform,
      }"
    >
      <div
        v-if="platform"
        class="flex items-center"
      >
        <img
          v-if="platformDetails"
          :src="platformDetails.image"
          :alt="platformDetails.name"
          class="w-4 h-4 mr-2"
        />

        <lf-icon name="grid-round-2" :size="16" class="text-gray-400 mr-2" />
        <p
          class="text-sm leading-5"
          :class="{
            'py-2': !module,
          }"
        >
          <span v-if="platformDetails">{{
            platformDetails.name
          }}</span>
          <span v-else>{{ platform }}</span>
        </p>
      </div>
    </div>
    <div
      class="flex-grow flex justify-between items-center"
    >
      <p class="text-sm leading-5">
        {{ label }}
      </p>
      <slot name="after" />
    </div>
  </article>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { lfIdentities } from '@/config/identities';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  platform: {
    type: String,
    required: false,
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    default: null,
  },
  isLastActivity: {
    type: Boolean,
    default: false,
  },
});

const platformDetails = computed(() => lfIdentities[props.platform]);
</script>

<script>
export default {
  name: 'AppActivityTypeListItem',
};
</script>
