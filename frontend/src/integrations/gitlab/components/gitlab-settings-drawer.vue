<template>
  <el-drawer
    v-model="modelValue"
    :title="$t('integrations.gitlab.settings.title')"
    :size="600"
    :destroy-on-close="true"
    @closed="onClose"
  >
    <div class="px-4">
      <p class="text-sm text-gray-500 mb-4">
        {{ $t('integrations.gitlab.settings.description') }}
      </p>

      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center">
          <el-checkbox v-model="selectAll" @change="toggleSelectAll">
            {{ $t('integrations.gitlab.settings.selectAll') }}
          </el-checkbox>
        </div>
        <div class="flex items-center">
          <span class="mr-2 text-sm">{{ $t('integrations.gitlab.settings.bulkAssign') }}</span>
          <el-select
            v-model="bulkSegment"
            :placeholder="$t('integrations.gitlab.settings.selectSegment')"
            @change="assignBulkSegment"
          >
            <el-option
              v-for="segment in segments"
              :key="segment.id"
              :label="segment.name"
              :value="segment.id"
            />
          </el-select>
        </div>
      </div>

      <div v-for="project in projects" :key="project.id" class="mb-4 flex items-center justify-between">
        <div class="flex items-center">
          <el-checkbox v-model="project.selected" @change="updateSelectAll">
            {{ project.name }}
          </el-checkbox>
        </div>
        <div class="flex items-center">
          <el-select
            v-model="project.segmentId"
            :placeholder="$t('integrations.gitlab.settings.selectSegment')"
            class="mr-2"
          >
            <el-option
              v-for="segment in segments"
              :key="segment.id"
              :label="segment.name"
              :value="segment.id"
            />
          </el-select>
          <el-button type="danger" icon="el-icon-delete" circle @click="discardRepo(project)" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <el-button @click="modelValue = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveMapping">{{ $t('common.save') }}</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useIntegrationStore } from '@/modules/integration/store/integration.store';
import { storeToRefs } from 'pinia';
import { useSegmentStore } from '@/modules/segment/store/segment.store';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: Boolean,
  integration: Object,
});

const emit = defineEmits(['update:modelValue']);

const integrationStore = useIntegrationStore();
const segmentStore = useSegmentStore();

const { currentIntegration } = storeToRefs(integrationStore);
const { segments } = storeToRefs(segmentStore);

const projects = ref([]);
const selectAll = ref(false);
const bulkSegment = ref('');

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

onMounted(async () => {
  await segmentStore.fetchAll();
  projects.value = currentIntegration.value.settings.projects.map((project) => ({
    ...project,
    selected: false,
    segmentId: '',
  }));
  updateSelectAll();
});

const toggleSelectAll = (val) => {
  projects.value.forEach((project) => {
    project.selected = val;
  });
};

const updateSelectAll = () => {
  selectAll.value = projects.value.every((project) => project.selected);
};

const assignBulkSegment = () => {
  projects.value.forEach((project) => {
    if (project.selected) {
      project.segmentId = bulkSegment.value;
    }
  });
};

const discardRepo = (project) => {
  const index = projects.value.findIndex((p) => p.id === project.id);
  if (index !== -1) {
    projects.value.splice(index, 1);
  }
  updateSelectAll();
};

const saveMapping = async () => {
  const mapping = projects.value
    .filter((project) => project.selected && project.segmentId)
    .reduce((acc, project) => {
      acc[project.path_with_namespace] = project.segmentId;
      return acc;
    }, {});

  try {
    await integrationStore.mapGitlabRepos(currentIntegration.value.id, mapping);
    ElMessage.success(this.$t('integrations.gitlab.settings.mappingSaved'));
    modelValue.value = false;
  } catch (error) {
    ElMessage.error(this.$t('integrations.gitlab.settings.mappingError'));
  }
};

const onClose = () => {
  projects.value = [];
  selectAll.value = false;
  bulkSegment.value = '';
};

watch(() => props.integration, () => {
  if (props.integration) {
    projects.value = props.integration.settings.projects.map((project) => ({
      ...project,
      selected: false,
      segmentId: '',
    }));
    updateSelectAll();
  }
}, { immediate: true });
</script>