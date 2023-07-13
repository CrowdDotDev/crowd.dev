<template>
  <el-form @submit.prevent>
    <div>
      <h6 class="text-gray-900">
        Select platforms
      </h6>
      <div class="text-xs mt-2 text-gray-500">
        Choose the community platforms and timeframe you
        want to monitor.
      </div>
    </div>

    <div class="mt-8">
      <div class="text-gray-900 text-xs font-semibold">
        Date published
      </div>
      <div class="flex gap-2 mt-2">
        <app-eagle-eye-published-date
          v-model:date-published="publishedDate"
        />
      </div>
    </div>

    <div class="mt-8">
      <div class="text-gray-900 text-xs font-semibold mb-1">
        Platforms
        <span class="text-red-500 ml-0.5 font-normal">*</span>
      </div>
      <p class="mb-5 text-xs text-gray-500">
        For better results, we recommend choosing at least 3
        platforms.
      </p>

      <app-eagle-eye-platforms
        v-model:platforms="platforms"
      />
    </div>

    <eagle-eye-footer
      :show-previous-step="true"
      :is-next-button-disabled="!isPlatformsFormValid"
      @on-step-change="
        (increment) => emit('onStepChange', increment)
      "
    />
  </el-form>
</template>

<script setup>
import {
  computed,
  defineProps,
  defineEmits,
  watch,
  ref,
} from 'vue';
import EagleEyeFooter from '@/premium/eagle-eye/components/onboard/eagle-eye-footer.vue';
import AppEagleEyePlatforms from '@/premium/eagle-eye/components/eagle-eye-platforms.vue';
import AppEagleEyePublishedDate from '@/premium/eagle-eye/components/eagle-eye-published-date.vue';

const emit = defineEmits([
  'update:platforms',
  'update:publishedDate',
  'onStepChange',
]);
const props = defineProps({
  platforms: {
    type: Object,
    required: true,
  },
  publishedDate: {
    type: String,
    required: true,
  },
});

const arePlatformsValid = (platformsObject) => (
  Object.values(platformsObject).filter((v) => v).length
    > 0
);

const isPlatformsFormValid = ref(
  arePlatformsValid(props.platforms),
);

const platforms = computed({
  get() {
    return props.platforms;
  },
  set(v) {
    emit('update:platforms', v);
  },
});

const publishedDate = computed({
  get() {
    return props.publishedDate;
  },
  set(v) {
    emit('update:publishedDate', v);
  },
});

watch(
  () => props.platforms,
  (updatedPlatforms) => {
    isPlatformsFormValid.value = arePlatformsValid(
      updatedPlatforms,
    );
  },
  { deep: true },
);
</script>
