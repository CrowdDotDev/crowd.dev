<template>
  <article class="pt-2 pl-9">
    <div class="relative">
      <img v-if="props.guide.loomThumbnailUrl" :alt="props.guide.title" :src="props.guide.loomThumbnailUrl" class="w-full">
      <div class="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white to-transparent" />
    </div>

    <div class="flex items-center justify-center pt-1">
      <el-button
        v-if="props.guide.loomHtml"
        class="btn btn--transparent btn--md mb-4 leading-5 mx-2"
        @click="emit('open')"
      >
        <i class="ri-book-open-line mr-2" />Learn more
      </el-button>
      <router-link :to="props.guide.buttonLink">
        <el-button
          v-if="props.guide.buttonText"
          class="btn btn--primary btn--md mb-4 leading-5 mx-2"
          @click="trackBtnClick(props.guide.key)"
        >
          {{ props.guide.buttonText }}
        </el-button>
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import { TenantEventService } from '@/shared/events/tenant-event.service';
import { QuickstartGuide } from '@/modules/quickstart/types/QuickstartGuide';

const props = defineProps<{
  guide: QuickstartGuide
}>();

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

<script lang="ts">
export default {
  name: 'CrQuickstartGuideItemContent',
};
</script>
