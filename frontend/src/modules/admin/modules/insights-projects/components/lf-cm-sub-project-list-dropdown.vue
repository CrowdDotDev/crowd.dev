<template>
  <app-form-item
    class="mb-0"
    :validation="$v.projectId"
    label="Project"
    :required="true"
    :error-messages="{
      required: 'Project is required',
    }"
  >
    <el-input
      ref="inputRef"
      v-model="inputValue"
      class="subprojects-select-input"
      placeholder="Select option"
      readonly
      :suffix-icon="isPopoverVisible ? ArrowUpIcon : ArrowDownIcon"
      @blur="$v.projectId.$touch"
      @click="isPopoverVisible = true"
    />
  </app-form-item>

  <el-popover
    v-model:visible="isPopoverVisible"
    :virtual-ref="inputRef"
    placement="bottom"
    trigger="manual"
    virtual-triggering
    popper-class="subprojects-select-popper"
    :teleported="false"
  >
    <div class="mb-2 border-b border-gray-100 px-2 pt-2 pb-1 w-full">
      <el-input
        id="filterSearch"
        ref="searchQueryInput"
        v-model="searchQuery"
        placeholder="Search..."
        class="filter-dropdown-search"
        :prefix-icon="SearchIcon"
        @input="onSearchProjects"
      />
    </div>

    <div class="p-2">
      <div v-if="projectsList.length" class="flex flex-col gap-4">
        <div
          v-for="project in projectsList"
          :key="project.id"
          class="h-10 flex items-center px-3 text-xs text-gray-900 hover:bg-gray-50 rounded cursor-pointer"
          :class="{
            'bg-primary-50': project.id === form.projectId,
          }"
          @click="onOptionClick(project)"
        >
          {{ project.name }}
        </div>
      </div>
      <div v-else class="text-gray-400 px-3 h-10 flex items-center">
        No projects found
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import {
  reactive, h, ref, onMounted,
} from 'vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { InsightsProjectsService } from '@/modules/admin/modules/insights-projects/services/insights-projects.service';

const SearchIcon = h(
  'i', // type
  { class: 'fa-light fa-magnifying-glass c-icon' }, // props
  [],
);

const ArrowDownIcon = h(
  'i', // type
  { class: 'fa-light fa-chevron-down c-icon' }, // props
  [],
);

const ArrowUpIcon = h(
  'i', // type
  { class: 'fa-light fa-chevron-up c-icon' }, // props
  [],
);

const emit = defineEmits(['onChange']);
const props = defineProps({
  selectedProject: {
    type: Object,
    default: () => {},
  },
});

const inputRef = ref(null);
const loading = ref(false);
const searchQuery = ref('');
const projectsList = ref<any[]>([]);
const isPopoverVisible = ref(false);

const inputValue = ref('');
const form = reactive({
  projectId: '',
});

const rules = {
  projectId: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const listProjects = (clearList?: boolean) => {
  loading.value = true;

  InsightsProjectsService.querySubProjects({
    filter: {
      name: searchQuery.value,
    },
  })
    .then((response) => {
      if (clearList) {
        projectsList.value = response.rows;
      } else {
        projectsList.value = projectsList.value.concat(response.rows);
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  listProjects();

  if (props.selectedProject) {
    form.projectId = props.selectedProject.id;
    inputValue.value = props.selectedProject.name;
  }
});

const onSearchProjects = (query: string) => {
  searchQuery.value = query;

  listProjects(true);
};

const onOptionClick = (project: any) => {
  isPopoverVisible.value = false;

  form.projectId = project.id;
  inputValue.value = project.name;

  emit('onChange', {
    projectId: form.projectId,
    isSubmitEnabled: !$v.value.$invalid,
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfCmSubProjectListDropdown',
};
</script>
