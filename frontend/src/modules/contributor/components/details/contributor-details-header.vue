<template>
  <div class="flex items-center">
    <div class="relative">
      <lf-avatar
        :size="48"
        :name="props.contributor.displayName"
        :src="avatar(props.contributor)"
      />
      <div
        v-if="isNew(props.contributor)"
        class="absolute -top-1.5 left-1/2 border-2 border-white bg-primary-500
      text-xtiny rounded-md px-0.5 text-white font-semibold transform -translate-x-1/2 "
      >
        New
      </div>
    </div>
    <div class="pl-3">
      <h5 class="mb-1 max-w-80 truncate">
        {{ props.contributor.displayName }}
      </h5>
      <!-- TODO -->
      <!--      <p class="text-small text-gray-500">-->
      <!--        Team lead at-->
      <!--      </p>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';

const props = defineProps<{
  contributor: Contributor,
}>();

const { avatar, isNew } = useContributorHelpers();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsHeader',
};
</script>
