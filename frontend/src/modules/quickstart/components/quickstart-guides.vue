<template>
  <div class="panel !p-0 !rounded-lg mb-10">
    <section class="relative">
      <div class="absolute h-1 bg-green-500 top-0 left-0" :style="{ width: `${completionPercentage}%` }" />
      <div v-if="loading">
        <app-loading height="7.5rem" class="mb-1" />
        <app-loading height="7.5rem" class="mb-1" />
        <app-loading height="7.5rem" class="mb-1" />
        <app-loading height="7.5rem" />
      </div>
      <el-collapse v-else v-model="activeView" accordion class="guides">
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
            :disabled="(hasSampleData && guide.disabledInSampleData)
            "
            class="relative cursor-auto px-6 py-2"
          >
            <template #title>
              <cr-quickstart-guide-item-head :guide="guide" />
            </template>
            <template #default>
              <cr-quickstart-guide-item-content
                :guide="guide"
                @open="onGuideOpen(guide)"
              />
            </template>
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
import AppDashboardGuideModal from '@/modules/dashboard/components/guide/dashboard-guide-modal.vue';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { useQuickStartStore } from '@/modules/quickstart/store';
import { TenantEventService } from '@/shared/events/tenant-event.service';
import CrQuickstartGuideItemHead from '@/modules/quickstart/components/item/quickstart-guide-item-head.vue';
import CrQuickstartGuideItemContent from '@/modules/quickstart/components/item/quickstart-guide-item-content.vue';
import AppLoader from '@/shared/loading/loader.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';

const { currentTenant, currentTenantUser } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');

const storeQuickStartGuides = useQuickStartStore();
const { guides, notcompletedGuides } = storeToRefs(
  storeQuickStartGuides,
);
const { getGuides } = storeQuickStartGuides;

const activeView = ref(null);
const selectedGuide = ref(null);
const loading = ref(false);

const hasSampleData = computed(
  () => currentTenant.value?.hasSampleData,
);

const completionPercentage = computed(() => {
  const completed = guides.value.filter((g) => g.completed).length;
  return (completed / guides.value.length) * 100;
});

const showModals = () => {
  if (
    !currentTenantUser.value?.settings
  ) {
    return;
  }
  loading.value = true;
  getGuides({}).then(() => {
    activeView.value = notcompletedGuides.value?.length
      ? notcompletedGuides.value[0].key
      : null;
  })
    .finally(() => {
      loading.value = false;
    });
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
    console.log('refreshed');
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
  name: 'CrQuickstartGuides',
};
</script>

<style lang="scss">
.guides.el-collapse {
  .el-collapse-item__header {
    line-height: 1.25rem !important;
    height: auto !important;
    @apply text-xs font-medium py-4;
  }
  .el-collapse-item__wrap{
    @apply border-0;
  }
  .el-collapse-item__arrow {
     @apply block;
   }

}
</style>
