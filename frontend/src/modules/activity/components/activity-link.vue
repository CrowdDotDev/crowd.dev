<template>
  <a
    v-if="activity && activity.url && platform?.activity?.showLink"
    :href="activity.url"
    class="text-2xs text-gray-500 font-medium flex items-center"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop
  ><i class="text-sm ri-external-link-line mr-1" />
    <span
      v-if="platform"
      class="block"
    >Open on {{ platform.name }}</span>
    <span v-else class="block">Open link</span></a>
</template>

<script>
import { lfIdentities } from '@/config/identities';

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
