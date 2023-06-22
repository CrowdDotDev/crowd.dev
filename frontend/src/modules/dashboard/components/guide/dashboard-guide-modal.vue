<template>
  <app-dialog
    v-model="modalOpened"
    :title="guide?.title || ''"
  >
    <template #header>
      <div>
        <h5 class="text-lg font-semibold leading-8 pb-1">
          {{ guide?.title }}
        </h5>
        <p class="text-xs text-gray-600">
          {{ guide?.body }}
        </p>
      </div>
    </template>

    <template #content>
      <div v-if="guide?.loomHtml" class="px-6 pb-6 loom">
        <div v-html="guide.loomHtml" />
      </div>
      <div
        v-if="guide?.buttonText"
        class="flex justify-end px-6 pb-6"
      >
        <router-link :to="guide?.buttonLink">
          <el-button
            class="btn btn--primary btn--md"
            @click="trackBtnClick(guide.key)"
          >
            {{ guide?.buttonText }}
          </el-button>
        </router-link>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import AppDialog from '@/shared/dialog/dialog.vue';
import { TenantEventService } from '@/shared/events/tenant-event.service';

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const guide = computed(() => props.modelValue);

const modalOpened = computed({
  get() {
    return props.modelValue !== null;
  },
  set(value) {
    emit(
      'update:modelValue',
      value ? props.modelValue : null,
    );
  },
});

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
  name: 'AppDashboardGuideModal',
};
</script>

<style lang="scss">
.loom {
  .lo-emb-vid {
    padding-bottom: 59% !important;
  }
}
</style>
