<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-linkedin-drawer"
    title="LinkedIn"
    size="600px"
    pre-title="Integration"
    has-border
    @close="isVisible = false"
  >
    <template #beforeTitle>
      <img
        class="min-w-6 h-6 mr-2"
        :src="logoUrl"
        alt="LinkedIn logo"
      />
    </template>
    <template #content>
      <div
        class="flex flex-col gap-2 items-start mb-2"
      />
      <el-form
        v-if="isVisible"
        label-position="top"
        class="form integration-linkedin-form"
        @submit.prevent
      >
        <div class="flex flex-col gap-2 items-start">
          <span class="block text-sm font-semibold mb-2">Organization profile</span>
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor all comments and reactions to posts or
            shares from one of your associated organization
            profiles. <br />
          </span>
          <el-select
            v-model="model"
            placeholder="Select option"
          >
            <el-option
              v-for="organization of organizations"
              :key="organization.id"
              :label="organization.vanityName"
              :value="organization.id"
            />
          </el-select>
          <div
            v-if="
              integration.status === 'pending-action'
                && model === null
            "
            class="text-yellow-600 flex items-start"
          >
            <lf-icon name="alert-triangle" :size="16" class="mr-2" />
            <div class="text-sm pt-0.5">
              <span class="font-medium">Action required.</span>
              Select one of your associated organization
              profiles to start tracking LinkedIn activities
            </div>
          </div>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div
        class="flex grow items-center"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <lf-button
          v-if="hasFormChanged"
          type="primary-link"
          @click="doReset"
        >
          <lf-icon name="arrow-turn-left" :size="16" />
          <span>Reset changes</span>
        </lf-button>
        <div class="flex gap-4">
          <lf-button
            type="outline"
            @click="isVisible = false"
          >
            Cancel
          </lf-button>
          <lf-button
            type="primary"
            class="!rounded-full"
            :disabled="!hasFormChanged || loading"
            :loading="loading"
            @click="hasFormChanged ? connect() : undefined"
          >
            {{
              integration.settings?.organizations.length > 0
                ? 'Update'
                : 'Connect'
            }}
          </lf-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import {
  defineEmits,
  defineProps,
  computed,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import linkedin from '@/config/integrations/linkedin/config';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const store = useStore();

const props = defineProps<{
  modelValue: boolean;
  integration: any;
  segmentId: string;
  grandparentId: string;
}>();

const { trackEvent } = useProductTracking();

const emit = defineEmits(['update:modelValue']);
const organizations = computed(
  () => props.integration.settings?.organizations,
);
const selectedOrg = computed(() => organizations.value.find((o: any) => o.inUse === true));

const model = ref(
  selectedOrg.value ? selectedOrg.value.id : null,
);
const loading = ref(false);

const logoUrl = linkedin.image;

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});

const hasFormChanged = computed(() => {
  if (selectedOrg.value === undefined) {
    return model.value !== null;
  }
  return model.value !== selectedOrg.value.id;
});

const doReset = () => {
  model.value = selectedOrg.value
    ? selectedOrg.value.id
    : null;
};

const connect = async () => {
  loading.value = true;

  await store.dispatch(
    'integration/doLinkedinOnboard',
    {
      organizationId: model.value,
      segmentId: props.segmentId,
      grandparentId: props.grandparentId,
    },
  );

  const isUpdate = props.integration?.settings?.organizations.length > 0;

  trackEvent({
    key: isUpdate ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS : FeatureEventKey.CONNECT_INTEGRATION,
    type: EventType.FEATURE,
    properties: { platform: Platform.LINKEDIN },
  });

  loading.value = false;
  isVisible.value = false;
};

watch(isVisible, (newValue, oldValue) => {
  if (newValue) {
    (window as any).analytics.track('LinkedIn: settings drawer', {
      action: 'open',
    });
  } else if (newValue === false && oldValue) {
    (window as any).analytics.track('LinkedIn: settings drawer', {
      action: 'close',
    });
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfLinkedinSettingsDrawer',
};
</script>
