<template>
  <article class="pt-2 pl-9 -mb-2">
    <img :alt="props.guide.title" :src="`/images/quickstart/${props.guide.key}.jpg`" class="w-full">

    <div class="flex items-center justify-center pt-6">
      <a
        v-if="props.guide.learnMoreLink"
        :href="props.guide.learnMoreLink"
        target="_blank"
        rel="noopener noreferrer"
      >
        <el-button
          class="btn btn--transparent btn--md leading-5 mx-2"
        >
          <i class="ri-book-open-line mr-2" />Learn more
        </el-button>
      </a>

      <router-link :to="props.guide.buttonLink">
        <el-button
          v-if="props.guide.buttonText"
          class="btn btn--primary btn--md leading-5 mx-2"
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
