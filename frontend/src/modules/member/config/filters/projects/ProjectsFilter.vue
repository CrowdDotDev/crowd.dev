<template>
  <div class="p-2">
    <app-lf-project-filter
      v-model:options="filteredOptions"
      @on-change="onFilterChange"
      @on-search-change="onSearchQueryChange"
    />
  </div>
</template>

<script setup lang="ts">
import AppLfProjectFilter from '@/modules/lf/segments/components/filter/lf-project-filter.vue';
import debounce from 'lodash/debounce';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import {
  CustomFilterOptions,
  CustomFilterConfig,
} from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

export interface ProjectsFilterValue {
  value: string[]
}

const props = defineProps<
  {
    modelValue: ProjectsFilterValue;
    data: any;
    config: CustomFilterConfig;
  } & CustomFilterOptions
>();
const emit = defineEmits<{(e: 'update:modelValue', value: ProjectsFilterValue): void,
  (e: 'update:data', value: any): void;
}>();

const loading = ref(false);

const filteredOptions = ref<any[]>([]);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const form = computed({
  get: () => props.modelValue,
  set: (value: { value: string[] }) => emit('update:modelValue', value),
});

const data = computed({
  get: () => props.data,
  set: (value: any) => emit('update:data', value),
});

const defaultForm: ProjectsFilterValue = {
  value: [],
};

const rules: any = {
  value: {
    required,
  },
};

useVuelidate(rules, form);

watch(filteredOptions, (value?: string[]) => {
  if (!data.value?.options?.length && form.value.value?.length) {
    data.value.options = value?.filter((option) => option.selectedChildren.length);
  }
});

const buildOptions = (projects) => {
  filteredOptions.value = projects.map((p) => {
    const segments = props.modelValue.value || [];
    const selectedSubProjects = p.subprojects.filter((subproject) => segments.includes(subproject.id));

    return {
      id: p.id,
      label: p.name,
      selected: !!selectedSubProjects.length,
      indeterminate:
        selectedSubProjects.length > 0
        && selectedSubProjects.length < p.subprojects.length,
      selectedChildren: selectedSubProjects.map(
        (subproject) => subproject.name,
      ),
      children: p.subprojects.map((sp) => ({
        id: sp.id,
        label: sp.name,
      })),
    };
  });
};

const onFilterChange = (value) => {
  const selection = value.reduce((acc, option) => {
    if (option.selectedChildren.length) {
      acc.selectedSegments.push(option);

      option.children.forEach((child) => {
        if (option.selectedChildren.includes(child.label)) {
          acc.selectedSubProjects.push(child.id);
        }
      });
    }

    return acc;
  }, {
    selectedSegments: [],
    selectedSubProjects: [],
  });

  data.value.options = selection.selectedSegments;
  form.value = { value: selection.selectedSubProjects };
};

const onSearchQueryChange = debounce((value) => {
  loading.value = true;
  props
    .remoteMethod?.({
      query: value,
      parentSlug: selectedProjectGroup.value.slug,
    })
    .then((projects) => {
      buildOptions(projects);
    })
    .finally(() => {
      loading.value = false;
    });
}, 300);

onMounted(() => {
  onSearchQueryChange('');
  emit('update:modelValue', {
    ...defaultForm,
    ...form.value,
  });
});
</script>
