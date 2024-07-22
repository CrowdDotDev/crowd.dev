<template>
  <lf-card v-bind="$attrs">
    <div class="px-5 py-4 flex justify-between items-center">
      <h6>Projects</h6>
      <lf-tooltip content="Manage activities affiliation per project" placement="top-end">
        <lf-button type="secondary" size="small" @click="isAffilationEditOpen = true">
          <lf-icon name="settings-4-line" />
          Activities affiliation
        </lf-button>
      </lf-tooltip>
    </div>
    <div>
      <article
        v-for="project in projects.slice(0, showMore ? projects.length : 3)"
        :key="project.id"
        class="border-b border-gray-100 px-5 py-4.5 flex items-center justify-between"
      >
        <div class="flex items-center">
          <lf-icon name="stack-line" :size="20" />
          <p class="pl-2 text-medium font-semibold">
            {{ project.name }}
          </p>
        </div>
        <div class="flex items-center">
          <p v-if="project.activityCount" class="mr-1 text-gray-500 text-small">
            {{ pluralize('activity', +project.activityCount, true) }} <span class="px-1">•</span>
          </p>
          <lf-button type="primary-link" size="small" @click="viewActivity(project.id)">
            View activity
          </lf-button>
        </div>
      </article>
    </div>
    <div v-if="projects.length > 3" class="px-5 py-4">
      <lf-button type="primary-link" size="small" @click="showMore = !showMore">
        Show {{ showMore ? 'less' : 'more' }}
      </lf-button>
    </div>
  </lf-card>
  <lf-contributor-edit-affilations v-model="isAffilationEditOpen" :contributor="props.contributor" />
</template>

<script setup lang="ts">
import LfCard from '@/ui-kit/card/Card.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Contributor } from '@/modules/contributor/types/Contributor';
import pluralize from 'pluralize';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfContributorEditAffilations
  from '@/modules/contributor/components/edit/affilations/contributor-affilations-edit.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const router = useRouter();
const route = useRoute();

const showMore = ref<boolean>(false);
const isAffilationEditOpen = ref<boolean>(false);

const projects = computed(() => props.contributor.segments);

const viewActivity = (projectId: string) => {
  router.replace({
    hash: '#activities',
    query: {
      ...route.query,
      subProjectId: projectId,
    },
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjects',
};
</script>
