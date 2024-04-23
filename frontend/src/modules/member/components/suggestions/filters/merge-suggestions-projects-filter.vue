<template>
  <el-popover v-model:visible="visible" placement="bottom-start" trigger="click" popper-class="!p-0" width="20rem">
    <template #reference>
      <cr-button type="secondary" size="small">
        <i class="ri-stack-line" /> <p>Projects: <span class="font-normal">All</span></p>
      </cr-button>
    </template>

    <div class="pt-1.5 pb-2 px-2">
      <article
        class="px-3 py-2.5 leading-5 font-xs flex justify-between items-center transition cursor-pointer rounded-md hover:bg-gray-50"
        :class="segments.length === 0 ? '!bg-brand-50' : ''"
        @click="segments = []"
      >
        <span class="text-black">All projects</span>
        <i v-if="segments.length === 0" class="ri-check-line text-lg text-primary-600" />
      </article>
    </div>
    <div class="border-t border-gray-100 px-2 pt-2 pb-1 w-full sticky top-0 bg-white z-10">
      <el-input
        id="filterSearch"
        ref="searchQueryInput"
        v-model="searchQuery"
        placeholder="Search..."
        class="lf-filter-input filter-dropdown-search"
        data-qa="filter-list-search"
        @input="onSearchQueryChange"
      />
    </div>
    <div class="p-2 border-t border-gray-100 flex flex-col gap-1">
      <section v-for="project of projects.list">
        <label
          class="px-3 py-2.5 leading-5 font-xs flex items-center transition cursor-pointer rounded-md hover:bg-gray-50"
        >
          <cr-checkbox v-model="segments" :value="project.id" />
          <p class="text-black text-xs">
            {{ project.name }}
          </p>
        </label>
        <label
          v-for="subproject of project.subprojects"
          class="pr-3 pl-10 py-2.5 leading-5 font-xs flex items-center transition cursor-pointer rounded-md hover:bg-gray-50"
        >
          <cr-checkbox v-model="childSegments" :value="subproject.id" />
          <p class="text-black text-xs">
            {{ subproject.name }}
          </p>
        </label>
      </section>
    </div>
    <div class="py-3 px-4 border-t border-gray-100 flex justify-end gap-3">
      <cr-button size="small" type="tertiary-gray" @click="visible = false">
        Cancel
      </cr-button>
      <cr-button size="small" type="primary" @click="apply()">
        Apply
      </cr-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrButton from '@/ui-kit/button/Button.vue';
import CrCheckbox from '@/ui-kit/checkbox/Checkbox.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import debounce from 'lodash/debounce';

const props = defineProps<{
  segments: string[]
  childSegments: string[]
}>();

const emit = defineEmits<{(e: 'update:segments', value: string[]): void,
  (e: 'update:childSegments', value: string[]): void}>();

const visible = ref<boolean>(false);

const segments = ref<string[]>(props.segments);
const childSegments = ref<string[]>(props.childSegments);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup, projects } = storeToRefs(lsSegmentsStore);
const { listProjects } = lsSegmentsStore;

// Search
const searchQuery = ref('');
const onSearchQueryChange = (value: string) => {
  setTimeout(() => {
    if (value === searchQuery.value) {
      listProjects({ parentSlug: selectedProjectGroup.value.slug, search: value, reset: true });
    }
  }, 300);
};

const apply = () => {
  emit('update:segments', segments.value);
  emit('update:childSegments', childSegments.value);
  visible.value = false;
};
</script>

<script lang="ts">
export default {
  name: 'AppMergeSuggestionsProjectsFilter',
};
</script>
