<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-confluence-drawer"
    title="Confluence"
    pre-title="Integration"
    has-border
    @close="cancel"
  >
    <template #beforeTitle>
      <img class="w-6 h-6 mr-2" :src="logoUrl" alt="Confluence logo" />
    </template>
    <template #content>
      <div class="text-gray-900 text-sm font-medium">
        Remote URL
      </div>
      <div class="text-2xs text-gray-500">
        Connect remote Confluence space.
      </div>

      <el-form class="mt-2" @submit.prevent>
        <el-input
          id="url"
          v-model="form.url"
          class="text-green-500"
          spellcheck="false"
          placeholder="Enter Organization URL"
        />
        <el-input
          v-if="form.space"
          id="spaceId"
          v-model="form.space.id"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter Space ID"
        />
        <el-input
          v-if="form.space"
          id="spaceKey"
          v-model="form.space.key"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter Space Key"
        />
        <el-input
          v-if="form.space"
          id="spaceName"
          v-model="form.space.name"
          class="text-green-500 mt-2"
          spellcheck="false"
          placeholder="Enter Space Name"
        />
      </el-form>
    </template>

    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--secondary mr-4"
          :disabled="loading"
          @click="cancel"
        >
          Cancel
        </el-button>
        <el-button
          id="confluenceConnect"
          :disabled="$v.$invalid || !hasFormChanged || loading"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="connect"
        >
          {{ integration?.settings ? 'Update' : 'Connect' }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import formChangeDetector from '@/shared/form/form-change';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  integration: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  segmentId: {
    type: String,
    required: true,
  },
  grandparentId: {
    type: String,
    required: true,
  },
});

const { trackEvent } = useProductTracking();

const loading = ref(false);
const form = reactive({
  url: '',
  space: {
    id: '',
    key: '',
    name: '',
  },
});

const { hasFormChanged, formSnapshot } = formChangeDetector(form);
const $v = useVuelidate({}, form, { $stopPropagation: true });

const { doConfluenceConnect } = mapActions('integration');
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const logoUrl = computed(() => CrowdIntegrations.getConfig('confluence').image);

onMounted(() => {
  if (props.integration?.settings) {
    form.url = props.integration?.settings.url;
    form.space = props.integration?.settings.space;
  }
  formSnapshot();
});

const cancel = () => {
  isVisible.value = false;
};

const connect = async () => {
  loading.value = true;

  const isUpdate = props.integration?.settings;

  doConfluenceConnect({
    settings: {
      url: form.url,
      space: form.space,
    },
    isUpdate,
    segmentId: props.segmentId,
    grandparentId: props.grandparentId,
  })
    .then(() => {
      trackEvent({
        key: isUpdate ? FeatureEventKey.EDIT_INTEGRATION_SETTINGS : FeatureEventKey.CONNECT_INTEGRATION,
        type: EventType.FEATURE,
        properties: {
          platform: Platform.CONFLUENCE,
        },
      });

      isVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<script>
export default {
  name: 'LfConfluenceSettingsDrawer',
};
</script>
