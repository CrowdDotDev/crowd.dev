<template>
  <el-dialog
    v-model="isModalVisible"
    :title="$t('integrations.gitlab.settings.bulkSelect')"
    width="500px"
  >
    <div class="px-6">
      <article class="pb-3">
        <p class="text-sm font-medium text-black mb-1">
          {{ $t('integrations.gitlab.settings.repositories') }}
        </p>
        <el-select
          v-model="form.repositories"
          :placeholder="$t('integrations.gitlab.settings.selectRepositories')"
          class="w-full"
          multiple
          filterable
        >
          <el-option
            value="all"
            :label="$t('integrations.gitlab.settings.allRepositories')"
            @click="form.repositories = ['all']"
          />
          <el-option
            v-for="repo in repositories"
            :key="repo.path_with_namespace"
            :value="repo.path_with_namespace"
            :label="repo.name"
            @click="isAll ? form.repositories = form.repositories.filter(r => r !== 'all') : null"
          />
        </el-select>
      </article>
      <article class="pb-8">
        <p class="text-sm font-medium text-black mb-1">
          {{ $t('integrations.gitlab.settings.mapWith') }}
        </p>
        <el-select
          v-model="form.segment"
          :placeholder="$t('integrations.gitlab.settings.selectSegment')"
          class="w-full"
          filterable
        >
          <el-option
            v-for="segment in segments"
            :key="segment.id"
            :value="segment.id"
            :label="segment.name"
          />
        </el-select>
      </article>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <el-button @click="closeModal">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" :disabled="!isValid" @click="applyMapping">
          {{ $t('integrations.gitlab.settings.mapRepositories') }}
          <span v-if="form.repositories.length > 0">
            ({{ isAll ? repositories.length : form.repositories.length }})
          </span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  repositories: Array,
  segments: Array,
});

const emit = defineEmits(['update:modelValue', 'apply']);

const isModalVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = reactive({
  repositories: [],
  segment: '',
});

const isAll = computed(() => form.repositories.includes('all'));

const isValid = computed(() => form.repositories.length > 0 && form.segment);

const closeModal = () => {
  isModalVisible.value = false;
  form.repositories = [];
  form.segment = '';
};

const applyMapping = () => {
  let repos = form.repositories;
  if (isAll.value) {
    repos = props.repositories.map((r) => r.path_with_namespace);
  }
  const mapping = repos.reduce((acc, url) => {
    acc[url] = form.segment;
    return acc;
  }, {});
  emit('apply', mapping);
  closeModal();
};
</script>

<script lang="ts">
export default {
  name: 'AppGitlabSettingsBulkSelect',
};
</script>
