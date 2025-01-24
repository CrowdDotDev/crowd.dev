<template>
  <a
    v-if="activity && activity.url && platform?.activity?.showLink"
    :href="activity.url"
    class="text-2xs text-gray-500 font-medium flex items-center"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop
  >
    <lf-icon name="arrow-up-right-from-square" :size="14" class="mr-1" />
    <span
      v-if="platform"
      class="block"
    >Open on {{ platform.name }}</span>
    <span v-else class="block">Open link</span></a>
</template>

<script>
import { lfIdentities } from '@/config/identities';
import LfIcon from '@/ui-kit/icon/Icon.vue';

export default {
  name: 'AppActivityLink',
  props: {
    activity: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  computed: {
    platform() {
      return lfIdentities[this.activity.platform];
    },
  },
};
</script>
