<template>
  <div
    v-if="
      notcompletedGuides.length > 0
        && !onboardingGuidesDismissed
    "
    class="panel !p-0 !rounded-lg mb-10"
  >
    <header class="bg-purple-50 p-4 relative">
      <div class="flex justify-between items-center">
        <i
          class="ri-lightbulb-line text-lg text-purple-800"
        />
        <el-tooltip
          content="Dismiss guide"
          placement="top-end"
        >
          <div
            class="cursor-pointer"
            @click="dismissGuides()"
          >
            <i
              class="ri-close-fill text-lg text-gray-400"
            />
          </div>
        </el-tooltip>
      </div>
      <div class="pb-4.5" />
      <p
        class="text-2xs text-purple-800 font-semibold uppercase"
      >
        QUICKSTART GUIDE
      </p>
    </header>
    <section class="pb-1 px-4">
      <el-collapse v-model="activeView" accordion>
        <el-tooltip
          v-for="guide of guides"
          :key="guide.key"
          :disabled="
            !(hasSampleData && guide.disabledInSampleData)
          "
          :content="guide.disabledTooltipText"
          placement="top"
        >
          <el-collapse-item
            :title="guide.title"
            :name="guide.key"
            :disabled="
              guide.completed
                || (hasSampleData && guide.disabledInSampleData)
            "
            class="relative cursor-auto"
          >
            <template #title>
              <h6
                class="text-xs"
                :class="
                  guide.completed
                    ? 'line-through text-gray-500 font-medium'
                    : 'font-semibold'
                "
              >
                {{ guide.title }}
              </h6>
              <i
                v-if="guide.completed"
                class="absolute right-0 bg-white ri-checkbox-circle-fill text-lg text-green-500 h-5 flex items-center"
              />
            </template>

            <app-dashboard-guide-item
              :guide="guide"
              @open="onGuideOpen(guide)"
            />
          </el-collapse-item>
        </el-tooltip>
      </el-collapse>
    </section>
  </div>
  <app-dashboard-guide-modal v-model="selectedGuide" />
</template>

<script setup>
import {
  ref, computed, onMounted, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import AppDashboardGuideItem from '@/modules/dashboard/components/guide/dashboard-guide-item.vue';
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { QuickstartGuideService } from '@/modules/quickstart-guide/services/quickstart-guide.service';
import { useQuickStartGuideStore } from '@/modules/quickstart-guide/store';
import { TenantEventService } from '@/shared/events/tenant-event.service';

const { currentTenant, currentTenantUser } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');

const storeQuickStartGuides = useQuickStartGuideStore();
const { guides, notcompletedGuides } = storeToRefs(
  storeQuickStartGuides,
);
const { getGuides } = storeQuickStartGuides;

const activeView = ref(null);
const selectedGuide = ref(null);

const onboardingGuidesDismissed = ref(false);

const hasSampleData = computed(
  () => currentTenant.value?.hasSampleData,
);

const dismissGuides = () => {
  ConfirmDialog({
    type: 'notification',
    title:
      'Do you really want to dismiss our Quickstart Guide?',
    message:
      'Users that follow our Quickstart Guide are 73% more likely to successfully set-up crowd.dev.',
    icon: 'ri-information-line',
    confirmButtonText: 'Dismiss quickstart guide',
    cancelButtonText: 'Cancel',
  }).then(() => {
    TenantEventService.event({
      name: 'Onboarding Guide dismissed',
    });

    onboardingGuidesDismissed.value = true;

    return QuickstartGuideService.updateSettings({
      isQuickstartGuideDismissed: true,
    });
  });
};

const showModals = () => {
  if (
    !currentTenantUser.value?.settings
  ) {
    return;
  }

  // Check if it can open eagle eye onboarding modal
  const {
    isQuickstartGuideDismissed,
  } = currentTenantUser.value.settings;

  // Check if onboarding guides dismissed
  onboardingGuidesDismissed.value = isQuickstartGuideDismissed || false;

  if (!onboardingGuidesDismissed.value) {
    activeView.value = notcompletedGuides.value?.length
      ? notcompletedGuides.value[0].key
      : null;
    getGuides({}).then(() => {
      activeView.value = notcompletedGuides.value?.length
        ? notcompletedGuides.value[0].key
        : null;
    });
  }
};

watch(
  () => currentTenantUser,
  (tenantUser) => {
    if (tenantUser) {
      showModals();
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

onMounted(() => {
  doRefreshCurrentUser({}).then(() => {
    if (currentTenantUser.value) {
      showModals();
    }
  });
});

const onGuideOpen = (guide) => {
  selectedGuide.value = guide;

  TenantEventService.event({
    name: 'Onboarding Guide details clicked',
    properties: {
      step: guide.key,
    },
  });
};
</script>

<script>
export default {
  name: 'AppDashboardGuides',
};
</script>

<style lang="scss">
.el-collapse {
  @apply border-none;

  .el-collapse-item__header {
    line-height: 1.25rem !important;
    height: auto !important;
    @apply text-xs font-medium py-4;

    &.is-active {
      @apply font-semibold;
    }
  }

  .el-collapse-item {
    &:last-child {
      .el-collapse-item__wrap,
      .el-collapse-item__header {
        border-bottom: 0;
      }
    }

    &.is-disabled {
      .el-collapse-item__header {
        @apply text-gray-400;
        cursor: auto !important;
      }

      .el-collapse-item__arrow {
        display: none;
      }
    }

  }

  .el-collapse-item__content {
    padding: 0;
  }
}
</style>
