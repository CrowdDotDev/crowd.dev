<template>
  <div>
    <div v-if="projects.length > 0">
      <!-- TODO: Add projects table -->
      <lf-button class="w-fit" size="medium" type="primary-ghost" @click="onAddProject">
        Add project
      </lf-button>
      <!-- Search input -->
      <lf-search
        v-model="search"
        class="h-9 flex-grow w-full"
        :lazy="true"
        placeholder="Search projects..."
        @update:model-value="searchProjects()"
      />
    </div>

    <div v-else-if="!loading" class="flex flex-col items-center">
      <app-empty-state-cta
        class="w-full !pb-0"
        icon="rectangle-history"
        title="No projects yet"
        description="Start adding projects into this collection"
      />
      <lf-button class="w-fit" size="medium" type="primary-ghost" @click="onAddProject">
        Add project
      </lf-button>
      <!-- Search input -->
      <lf-search
        v-model="search"
        class="h-9 flex-grow w-4/5"
        :lazy="true"
        placeholder="Search projects..."
        @update:model-value="searchProjects()"
      />
    </div>
    <div v-if="loading" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import AppEmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import { Project } from '@/modules/lf/segments/types/Segments';

defineProps<{
  collectionProjects?: Project[],
}>();

const search = ref('');
const loading = ref(false);

const projects = ref<{ id: string, name: string }[]>([]);

const searchProjects = () => {
  // TODO: Implement search projects
};

const onAddProject = () => {
  // TODO: Implement add project
};

</script>

<script lang="ts">
export default {
  name: 'LfCollectionAddProjectsTab',
};
</script>
