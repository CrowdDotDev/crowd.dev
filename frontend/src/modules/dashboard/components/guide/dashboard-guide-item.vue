<template>
  <article>
    <!-- content -->
    <div class="pb-1">
      <div
        v-if="
          props.guide.videoLink
            && props.guide.loomThumbnailUrl
        "
        class="relative rounded bg-gray-100 mb-4 w-full h-20 flex items-center justify-center bg-cover group cursor-pointer"
        :style="{
          'background-image': `linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${props.guide.loomThumbnailUrl})`,
        }"
        @click="emit('open')"
      >
        <i
          class="ri-play-circle-fill text-white text-2xl opacity-75 transform h-8 flex items-center group-hover:opacity-100 transition"
        />
      </div>
      <p class="text-xs text-gray-600 leading-5 mb-4">
        {{ props.guide.body }}
      </p>
      <router-link :to="props.guide.buttonLink">
        <el-button
          v-if="props.guide.buttonText"
          class="btn btn--primary btn--sm w-full mb-4 leading-5"
          @click="trackBtnClick(props.guide.key)"
        >
          {{ props.guide.buttonText }}
        </el-button>
      </router-link>
    </div>
  </article>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { TenantEventService } from '@/shared/events/tenant-event.service';

const props = defineProps({
  guide: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['open']);

const trackBtnClick = (step) => {
  TenantEventService.event({
    name: 'Onboarding Guide button clicked',
    properties: {
      step,
    },
  });
};
</script>

<script>
export default {
  name: 'AppDashboardGuideItem',
};
</script>
