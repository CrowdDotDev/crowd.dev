<template>
  <lf-card>
    <div class="p-5">
      <h6>Projects</h6>
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
          <router-link
            :to="{
              name: 'activity',
              query: filterQueryService().setQuery({
                search: '',
                relation: 'and',
                order: {
                  prop: 'timestamp',
                  order: 'descending',
                },
                projectGroup: selectedProjectGroup?.id,
                member: {
                  include: true,
                  value: [props.contributor.id],
                },
                projects: {
                  include: true,
                  value: [project.id],
                },
              }),
            }"
            class="text-sm leading-5 font-medium  hover:underline"
          >
            <lf-button type="primary-link" size="small">
              View activity
            </lf-button>
          </router-link>
        </div>
      </article>
    </div>
    <div v-if="projects.length > 3" class="px-5 py-4">
      <lf-button type="primary-link" size="small" @click="showMore = !showMore">
        Show {{ showMore ? 'less' : 'more' }}
      </lf-button>
    </div>
  </lf-card>
</template>

<script setup lang="ts">
import LfCard from '@/ui-kit/card/Card.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { computed, ref } from 'vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import allContacts from '@/modules/member/config/saved-views/views/all-contacts';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  contributor: Contributor,
}>();

const showMore = ref<boolean>(false);

const lfStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lfStore);

const projects = computed(() => props.contributor.segments);
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjects',
};
</script>
