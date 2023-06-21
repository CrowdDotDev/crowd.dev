<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @visible-change="open = $event"
  >
    <el-button
      type="button"
      class="btn btn--transparent btn--md"
      :class="{ '!bg-gray-200': open }"
    >
      <i class="ri-share-line mr-2" />Share
    </el-button>
    <template #dropdown>
      <div class="p-2 w-100">
        <div
          class="flex items-start justify-between flex-grow"
        >
          <div>
            <div class="font-medium text-gray-900 text-sm">
              Publish to web
            </div>
            <div class="text-gray-500 text-2xs">
              Anyone with the link can view the report
            </div>
          </div>
          <div>
            <el-switch
              v-model="model"
              @change="handlePublicChange"
            />
          </div>
        </div>
        <div class="mt-6 relative">
          <div
            v-if="!model"
            class="absolute inset-0 bg-gray-50 opacity-60 z-10 -m-4"
          />
          <div
            class="font-medium text-gray-900 text-sm mb-1"
          >
            Shareable URL
          </div>
          <el-input
            :value="computedPublicLink"
            :disabled="!model"
          >
            <template #append>
              <el-tooltip
                content="Copy to clipboard"
                placement="top"
              >
                <el-button
                  class="append-icon"
                  @click="copyPublicLinkToClipboard()"
                >
                  <i class="ri-file-copy-line" />
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup>
import {
  ref,
  computed,
  defineProps,
  defineEmits,
} from 'vue';
import Message from '@/shared/message/message';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { mapActions } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  segmentId: {
    type: String,
    required: true,
  },
});

const open = ref(false);

const { doUpdate } = mapActions('report');

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const computedPublicLink = computed(() => {
  const tenantId = AuthCurrentTenant.get();

  return `${window.location.origin}/tenant/${tenantId}/reports/${props.segmentId}/${props.id}/public`;
});

const copyPublicLinkToClipboard = async () => {
  await navigator.clipboard.writeText(
    computedPublicLink.value,
  );
  Message.success(
    'Report URL successfully copied to your clipboard',
  );
};

const handlePublicChange = async (value) => {
  await doUpdate({
    id: props.id,
    values: {
      public: value,
      ...({ ...props.segmentId ? null : { excludeSegments: true } }),
    },
    successMessage: `Report successfully ${value ? 'published' : 'unpublished'}`,
    errorMessage: `There was an error ${value ? 'publishing' : 'unpublishing'} your report`,
    segments: [props.segmentId],
  });
};
</script>
