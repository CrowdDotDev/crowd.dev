<template>
  <div
    v-if="showBanner"
  >
    <div class="pt-14">
      <!-- Links to {sub-project} integrations page -->
      <banner
        v-if="integrationsWithErrors.length === 1"
        variant="alert"
      >
        <div
          class="flex flex-wrap items-center justify-center grow text-sm"
        >
          <span>Currently,</span>
          <span class="font-semibold mx-1">{{ integrationsWithErrors[0]?.name }}</span>
          <span>has integrations with connectivity issues</span>
          <router-link
            :to="{
              name: 'integration',
              params: {
                id: integrationsWithErrors[0].id,
                grandparentId: selectedProjectGroup.id,
              },
            }"
          >
            <el-button
              class="btn btn--sm btn--primary ml-3"
            >
              Manage integrations
            </el-button>
          </router-link>
        </div>
      </banner>

      <!-- Links to {project group} settings page -->
      <banner
        v-else-if="integrationsWithErrors.length > 1"
        variant="alert"
      >
        <div
          class="flex flex-wrap items-center justify-center grow text-sm"
        >
          <span>Currently,</span>
          <span class="font-semibold mx-1">several sub-projects</span>
          <span>have integrations with connectivity issues</span>
          <router-link
            :to="{
              name: 'adminProjects',
              params: {
                id: selectedProjectGroup.id,
              },
            }"
          >
            <el-button
              class="btn btn--sm btn--primary ml-3"
            >
              Project group settings
            </el-button>
          </router-link>
        </div>
      </banner>

      <!-- Links to {sub-project} integrations page -->
      <banner
        v-else-if="integrationsWithNoData.length === 1"
        variant="alert"
      >
        <div
          class="flex flex-wrap items-center justify-center grow text-sm"
        >
          <span>Currently,</span>
          <span class="font-semibold mx-1">{{ integrationsWithNoData[0]?.name }}</span>
          <span>has integrations that are not receiving activities</span>
          <router-link
            :to="{
              name: 'integration',
              params: {
                id: integrationsWithNoData[0].id,
                grandparentId: selectedProjectGroup.id,
              },
            }"
          >
            <el-button
              class="btn btn--sm btn--primary ml-3"
            >
              Manage integrations
            </el-button>
          </router-link>
        </div>
      </banner>

      <!-- Links to {project group} settings page -->
      <banner
        v-else-if="integrationsWithNoData.length > 1"
        variant="alert"
      >
        <div
          class="flex flex-wrap items-center justify-center grow text-sm"
        >
          <span>Currently,</span>
          <span class="font-semibold mx-1">several sub-projects</span>
          <span>have integrations that are not receiving activities</span>
          <router-link
            :to="{
              name: 'adminProjects',
              params: {
                id: selectedProjectGroup.id,
              },
            }"
          >
            <el-button
              class="btn btn--sm btn--primary ml-3"
            >
              Project group settings
            </el-button>
          </router-link>
        </div>
      </banner>

      <!-- info 1 -->
      <banner
        v-else-if="integrationsInProgress.subProjects.length === 1"
        variant="info"
      >
        <div
          class="flex flex-wrap items-center justify-center grow text-sm"
        >
          <div
            v-loading="true"
            class="w-4 h-4 mr-3"
          />
          <span>{{ integrationsInProgressToString }} integration
            {{ integrationsInProgress.integrations.length > 1 ? 's are' : ' is' }} getting set up on</span>
          <span class="font-semibold mx-1">{{ integrationsInProgress.subProjects[0]?.name }}</span>
          <span>sub-project. Sit back and relax. We will send you an email when it's done.</span>
        </div>
      </banner>

      <!-- info 3 -->
      <banner
        v-else-if="integrationsInProgress.subProjects.length > 1"
        variant="info"
      >
        <div
          class="flex items-center justify-center grow text-sm"
        >
          <div
            v-loading="true"
            class="w-4 h-4 mr-3"
          />
          Integrations are getting set up on several sub-projects. Sit back and relax. We will send you an email when it's done.
        </div>
      </banner>
    </div>
  </div>
</template>

<script setup>
import Banner from '@/shared/banner/banner.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import {
  watch, ref, computed, onUnmounted,
} from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { isCurrentDateAfterGivenWorkingDays } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useRoute } from 'vue-router';

const ERROR_BANNER_WORKING_DAYS_DISPLAY = 3;

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
const integrations = ref([]);
const fetchIntegrationTimer = ref(null);
const loading = ref(true);

const route = useRoute();

const subProjects = computed(() => {
  if (!selectedProjectGroup.value) {
    return [];
  }

  return selectedProjectGroup.value.projects
    .reduce((acc, project) => {
      project.subprojects.forEach((subproject) => {
        acc.push(subproject);
      });

      return acc;
    }, []);
});

const integrationsWithErrors = computed(() => integrations.value.reduce((acc, integration) => {
  if (integration.status === 'error' && isCurrentDateAfterGivenWorkingDays(integration.updatedAt, ERROR_BANNER_WORKING_DAYS_DISPLAY)) {
    const hasSubProject = acc.some((sp) => sp.id === integration.segmentId);

    if (!hasSubProject) {
      const subproject = subProjects.value.find((sp) => sp.id === integration.segmentId);

      acc.push(subproject);
    }
  }

  return acc;
}, []));

const integrationsWithNoData = computed(() => integrations.value.reduce((acc, integration) => {
  if (integration.status === 'no-data') {
    const hasSubProject = acc.some((sp) => sp.id === integration.segmentId);

    if (!hasSubProject) {
      const subproject = subProjects.value.find((sp) => sp.id === integration.segmentId);

      acc.push(subproject);
    }
  }

  return acc;
}, []));

const integrationsInProgress = computed(() => integrations.value.reduce((acc, integration) => {
  if (integration.status === 'in-progress') {
    acc.integrations.push(integration);

    const hasSubProject = acc.subProjects.some((sp) => sp.id === integration.segmentId);

    if (!hasSubProject) {
      const subproject = subProjects.value.find((sp) => sp.id === integration.segmentId);

      acc.subProjects.push(subproject);
    }
  }

  return acc;
}, {
  integrations: [],
  subProjects: [],
}));

const integrationsInProgressToString = computed(() => {
  const arr = integrationsInProgress.value.integrations.map(
    (i) => CrowdIntegrations.getConfig(i.platform)?.name,
  );
  if (arr.length === 1) {
    return arr[0];
  } if (arr.length === 2) {
    return `${arr[0]} and ${arr[1]}`;
  }
  return (
    `${arr.slice(0, arr.length - 1).join(', ')
    }, and ${
      arr.slice(-1)}`
  );
});

const showBanner = computed(() => (integrationsWithErrors.value.length
  || integrationsWithNoData.value.length
  || integrationsInProgress.value.subProjects.length) && !route.meta.hideBanner && !!selectedProjectGroup.value && !loading.value);

const fetchIntegrations = (projectGroup) => {
  if (projectGroup) {
    IntegrationService.list(null, null, null, null, getSegmentsFromProjectGroup(projectGroup))
      .then((response) => {
        integrations.value = response.rows;
      })
      .finally(() => {
        loading.value = false;
      });
  }
};

const startTimer = () => {
  fetchIntegrationTimer.value = setInterval(() => fetchIntegrations(selectedProjectGroup.value), 30000); // Fetch integrations every 30 seconds
};

// Stop the timer
const stopTimer = () => {
  clearInterval(fetchIntegrationTimer.value);
};

watch(selectedProjectGroup, (updatedProjectGroup, previousProjectGroup) => {
  stopTimer();
  if (previousProjectGroup?.id !== updatedProjectGroup?.id) {
    loading.value = true;
  }
  fetchIntegrations(updatedProjectGroup);
}, {
  deep: true,
  immediate: true,
});

watch(
  integrationsInProgress,
  (newIntegrationsInProgress) => {
    if (newIntegrationsInProgress.integrations.length > 0) {
      startTimer();
    } else {
      stopTimer();
    }
  },

  {
    deep: true,
  },
);

onUnmounted(() => {
  stopTimer();
});

</script>

<script>
export default {
  name: 'AppLfBanners',
};
</script>
