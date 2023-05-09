<template>
  <div>
    <div
      v-if="loadingCube"
      v-loading="loadingCube"
      class="app-page-spinner"
    />
    <div v-else class="flex flex-col gap-8">
      <div
        v-for="widget in MEMBERS_REPORT.widgets"
        :key="widget.id"
      >
        <component
          :is="widget.component"
          v-if="!(widget.hideInPublicView && isPublicView)"
          :filters="filters"
          :is-public-view="isPublicView"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, defineProps } from 'vue';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import MEMBERS_REPORT from '@/modules/report/templates/config/members';

defineProps({
  filters: {
    type: Object,
    required: true,
  },
  isPublicView: {
    type: Boolean,
    default: false,
  },
});

const { cubejsApi, cubejsToken } = mapGetters('widget');

const loadingCube = computed(
  () => cubejsToken.value === null,
);

const { getCubeToken } = mapActions('widget');

onMounted(async () => {
  if (cubejsApi.value === null) {
    await getCubeToken();
  }
});
</script>
