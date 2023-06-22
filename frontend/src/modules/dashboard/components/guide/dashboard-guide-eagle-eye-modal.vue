<template>
  <app-dialog
    v-model="modalOpened"
    title="Eagle eye"
    size="small"
  >
    <template #header>
      <div>
        <p
          class="text-2xs font-semibold uppercase leading-5 text-brand-500 mb-2"
        >
          EAGLE EYE
        </p>
        <h4
          class="text-lg leading-8 font-semibold break-normal"
        >
          Gain developers’ mindshare and increase your
          community awareness
        </h4>
      </div>
    </template>

    <template #content>
      <div class="px-6 pb-7">
        <img
          alt="Eagle eye"
          src="/images/eagle-eye/modal-banner.jpg"
          class="w-full mb-8"
        />
        <p
          class="text-sm leading-5 text-gray-600 pb-9 break-normal"
        >
          Our Eagle Eye app allows you to monitor different
          community platforms to find relevant content to
          engage with, helping you to gain developers’
          mindshare and grow your community organically.
        </p>
        <router-link
          :to="{ name: 'eagleEye' }"
          @click="closing()"
        >
          <el-button
            class="btn btn--primary btn--md w-full"
            @click="trackBtnClick"
          >
            Explore Eagle Eye
          </el-button>
        </router-link>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import AppDialog from '@/shared/dialog/dialog.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { QuickstartGuideService } from '@/modules/quickstart-guide/services/quickstart-guide.service';
import { TenantEventService } from '@/shared/events/tenant-event.service';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { doRefreshCurrentUser } = mapActions('auth');

const closing = () => QuickstartGuideService.updateSettings({
  isEagleEyeGuideDismissed: true,
}).then(() => doRefreshCurrentUser({}));

const modalOpened = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
    if (!value) {
      // Track event on modal dismiss
      if (props.modelValue) {
        TenantEventService.event({
          name: 'Eagle Eye Guide dismissed',
        });
      }

      closing();
    }
  },
});

const trackBtnClick = () => {
  TenantEventService.event({
    name: 'Eagle Eye Guide button clicked',
  });
};
</script>

<script>
export default {
  name: 'AppDashboardGuideEagleEyeModal',
};
</script>
