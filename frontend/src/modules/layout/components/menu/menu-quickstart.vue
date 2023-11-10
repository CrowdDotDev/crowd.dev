<template>
  <div
    v-if="isPrimaryWorkspace && notcompletedGuides.length > 0"
    class="px-1"
  >
    <el-tooltip
      key="menu-link-quickstart"
      :disabled="!props.collapsed"
      :hide-after="50"
      content="Welcome aboard"
      effect="dark"
      placement="right"
      raw-content
    >
      <router-link
        id="menu-quickstart"
        :to="{ name: 'welcomeaboard' }"
        class="rounded-md h-8 transition !text-gray-400 flex items-center whitespace-nowrap
          flex-nowrap px-1.5 hover:bg-gray-50 mb-2 overflow-hidden text-sm"
        active-class="!bg-gray-100 font-medium !text-gray-900"
      >
        <div class="w-5 mr-3 block text-center">
          👋
        </div>
        <div class="flex flex-grow justify-between">
          <span class="!text-gray-900">
            Welcome aboard
          </span>
          <div class="text-xs font-normal leading-6 px-1 rounded bg-gray-100 text-gray-400">
            {{ guides.length - notcompletedGuides.length }}/{{ guides.length }}
          </div>
        </div>
      </router-link>
    </el-tooltip>
    <div class="border-t border-gray-200 mb-3 mt-1" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuickStartStore } from '@/modules/quickstart/store';
import { storeToRefs } from 'pinia';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps<{
  collapsed: boolean,
}>();

const { rows } = mapGetters('tenant');
const { currentTenant } = mapGetters('auth');

const storeQuickStartGuides = useQuickStartStore();
const { notcompletedGuides, guides } = storeToRefs(storeQuickStartGuides);
const { getGuides } = storeQuickStartGuides;

const isPrimaryWorkspace = computed(() => {
  const tenants = rows.value;
  if (tenants.length > 0) {
    const oldestTenant = tenants.reduce((oldest: any, tenant: any) => {
      const oldestDate = new Date(oldest.createdAt);
      const currentTenantDate = new Date(tenant.createdAt);
      return oldestDate > currentTenantDate ? tenant : oldest;
    }, tenants[0]);
    return oldestTenant.id === currentTenant.value.id;
  }
  return false;
});

onMounted(() => {
  getGuides();
});
</script>

<script lang="ts">
export default {
  name: 'CrMenuQuickstart',
};
</script>
