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
        class="border-b last:border-0 border-gray-100 px-5 py-4"
      >
        <div class="flex justify-between">
          <p class="text-medium font-semibold">
            {{ project.name }}
          </p>
          <div class="flex items-center pt-0.5">
            <p v-if="project.activityCount" class="mr-1 text-gray-500 text-small">
              {{ pluralize('activity', +project.activityCount, true) }} <span class="px-1">•</span>
            </p>
            <lf-button type="primary-link" size="small" @click="viewActivity(project.id)">
              View activity
            </lf-button>
          </div>
        </div>
        <div v-if="Object.keys(project.affiliations).length" class="flex items-center pt-1 text-gray-500 gap-2">
          <p class="text-small">
            Affiliation:
          </p>
          <lf-tooltip v-for="(aff, orgId) in project.affiliations" :key="orgId">
            <template #content>
              <p class="text-left">
                <span class="font-semibold">Affiliation period:<br></span>
                <span v-html="getAffilationPeriodText(aff)" />
              </p>
            </template>
            <div class="flex items-center">
              <lf-avatar :src="aff[0].organizationLogo" :name="aff[0].organizationName" :size="18" class="!rounded border border-gray-200 mr-1 mt-px">
                <template #placeholder>
                  <div class="w-full h-full bg-gray-50 flex items-center justify-center">
                    <lf-icon name="community-line" :size="14" class="text-gray-400" />
                  </div>
                </template>
              </lf-avatar>
              <router-link
                :to="{
                  name: 'organizationView',
                  params: { id: orgId },
                  query: {
                    projectGroup: selectedProjectGroup?.id,
                    segmentId: aff[0].segmentId,
                  },
                }"
                class="cursor-pointer text-small leading-5 underline decoration-dashed text-gray-500
             decoration-gray-500 underline-offset-4 hover:decoration-gray-900 hover:!text-black max-w-30 truncate"
              >
                {{ aff[0].organizationName }}
              </router-link>
            </div>
          </lf-tooltip>
        </div>
      </article>
    </div>
    <div v-if="projects.length > 3" class="px-5 py-4">
      <lf-button type="primary-link" size="small" @click="showMore = !showMore">
        Show {{ showMore ? 'less' : 'more' }}
      </lf-button>
    </div>
  </lf-card>
  <lf-contributor-edit-affilations
    v-if="isAffilationEditOpen"
    v-model="isAffilationEditOpen"
    :contributor="props.contributor"
  />
</template>

<script setup lang="ts">
import LfCard from '@/ui-kit/card/Card.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Contributor, ContributorAffiliation } from '@/modules/contributor/types/Contributor';
import pluralize from 'pluralize';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfContributorEditAffilations
  from '@/modules/contributor/components/edit/affilations/contributor-affilations-edit.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import moment from 'moment/moment';

const props = defineProps<{
  contributor: Contributor,
}>();

const router = useRouter();
const route = useRoute();

const showMore = ref<boolean>(false);
const isAffilationEditOpen = ref<boolean>(false);

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const getAffiliations = (projectId: string) => props.contributor.affiliations.filter((affiliation) => affiliation.segmentId === projectId)
  .reduce((obj: Record<string, ContributorAffiliation[]>, aff: ContributorAffiliation) => {
    if (!obj[aff.organizationId]) {
      return {
        ...obj,
        [aff.organizationId]: [aff],
      };
    }
    return {
      ...obj,
      [aff.organizationId]: [...obj[aff.organizationId], aff],
    };
  }, {});

const projects = computed(() => props.contributor.segments.map((p) => ({
  ...p,
  affiliations: getAffiliations(p.id),
})));

const viewActivity = (projectId: string) => {
  router.replace({
    hash: '#activities',
    query: {
      ...route.query,
      subProjectId: projectId,
    },
  });
};

const getAffilationPeriodText = (affilations: ContributorAffiliation[]) => affilations.map(({ dateStart, dateEnd }) => {
  const start = dateStart
    ? moment(dateStart).utc().format('MMM YYYY')
    : 'Unknown';
  const endDefault = dateStart ? 'Present' : 'Unknown';
  const end = dateEnd
    ? moment(dateEnd).utc().format('MMM YYYY')
    : endDefault;
  if (start === end) {
    return start;
  }
  return `${start} → ${end}`;
}).join(' <br> ');

</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsProjects',
};
</script>
