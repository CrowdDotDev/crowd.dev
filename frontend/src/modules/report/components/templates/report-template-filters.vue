<template>
  <div class="border-t border-gray-200">
    <div class="flex items-center gap-6 py-4 max-w-5xl mx-auto px-8">
      <app-filter-list-item
        v-if="showPlatform"
        :filter="platform"
        filter-class="custom"
        @change="onPlatformChange"
        @reset="onPlatformReset"
      >
        <template #button>
          <div class="relative">
            <el-button class="custom-btn" @click="handleOpenPlatform">
              <div class="flex items-center gap-2">
                <i class="ri-apps-2-line" /><span class="font-medium"
                  >Platforms:
                  <span class="font-normal text-gray-600">{{
                    platformLabel
                  }}</span></span
                >
              </div>
            </el-button>
            <div
              v-if="hasSelectedPlatform"
              class="w-2 h-2 rounded-full bg-brand-500 outline outline-4 outline-gray-50 absolute top-[-4px] right-[-4px]"
            />
          </div>
        </template>
        <template #optionPrefix="{ item }">
          <img
            v-if="
              item.value &&
              platformOptions(item.value) &&
              platformOptions(item.value).image
            "
            :src="platformOptions(item.value).image"
            :alt="platformOptions(item.value).name"
            class="w-4 h-4 mr-2"
          />
          <i v-else class="ri-radar-line text-base !text-gray-400 !mr-2" />
        </template>
      </app-filter-list-item>

      <div v-if="showTeamMembers" class="flex gap-2 items-center">
        <el-switch
          class="switch-filter !ml-0"
          :model-value="teamMembers"
          size="small"
          active-text="Include team members"
          @change="onTeamMembersChange"
        />
      </div>

      <div v-if="showTeamActivities" class="flex gap-2 items-center">
        <el-switch
          class="switch-filter !ml-0"
          :model-value="teamActivities"
          size="small"
          active-text="Include team activities"
          @change="onTeamActivitiesChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, reactive } from 'vue';
import AppFilterListItem from '@/shared/filter/components/filter-list-item.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits([
  'update:platform',
  'update:teamMembers',
  'update:teamActivities',
  'trackFilters',
  'reset',
  'open',
]);
const props = defineProps({
  platform: {
    type: Object,
    default: null,
  },
  teamMembers: {
    type: Boolean,
    default: null,
  },
  teamActivities: {
    type: Boolean,
    default: null,
  },
  showPlatform: {
    type: Boolean,
    default: true,
  },
  showTeamMembers: {
    type: Boolean,
    default: true,
  },
  showTeamActivities: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();
const hasSelectedPlatform = computed(() => !!props.platform.value.length);
const platformLabel = computed(() => {
  if (!hasSelectedPlatform.value) {
    return 'All';
  }

  return props.platform.value.map((v) => v.label).join(', ');
});

const platformOptions = (platform) => CrowdIntegrations.getConfig(platform);
if (!!route.query.selectedPlatforms) {
  const platformsValues = route.query.selectedPlatforms.split(' ');
  const platforms = platformsValues
    .map((value) => {
      const platform = platformOptions(value);
      if (!platform) {
        return null;
      }

      return {
        value,
        label: platform.name,
        selected: false,
      };
    })
    .filter((v) => !!v);

  emit('update:platform', {
    ...props.platform,
    value: platforms,
    expanded: false,
    operator: null,
    include: true,
  });
  emit('trackFilters');
}

const onPlatformChange = (newPlatform) => {
  router.replace({
    query: {
      ...route.query,
      selectedPlatforms: newPlatform.value.map((v) => v.value).join(' '),
    },
  });
  console.log({ newPlatform });
  emit('update:platform', newPlatform);
  emit('trackFilters');
};
const onPlatformReset = () => {
  router.replace({
    query: {
      ...route.query,
      selectedPlatforms: '',
    },
  });
  emit('reset');
  emit('trackFilters');
};

if (route.query.showTeamMembers === 'true') {
  emit('update:teamMembers', true);
  emit('trackFilters');
}

const onTeamMembersChange = (value) => {
  router.replace({
    query: {
      ...route.query,
      showTeamMembers: value,
    },
  });
  emit('update:teamMembers', value);
  emit('trackFilters');
};

if (route.query.showTeamActivities === 'true') {
  emit('update:teamActivities', true);
  emit('trackFilters');
}

const onTeamActivitiesChange = (value) => {
  router.replace({
    query: {
      ...route.query,
      showTeamActivities: value,
    },
  });
  emit('update:teamActivities', value);
  emit('trackFilters');
};

const handleOpenPlatform = () => {
  emit('open');
};
</script>

<style lang="scss">
.custom-btn {
  @apply bg-white border border-gray-100 shadow text-gray-900;

  &:active,
  &:focus,
  &:hover {
    @apply bg-gray-100 text-gray-900 border-gray-100;
  }
}

.switch-filter .el-switch__label span {
  @apply text-xs text-gray-900 font-normal;
}
</style>
