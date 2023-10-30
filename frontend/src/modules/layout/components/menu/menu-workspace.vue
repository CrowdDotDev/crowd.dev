<template>
  <div>
    <el-popover
      ref="popover"
      v-model:visible="isDropdownOpen"

      placement="right-start"
      :width="340"
      trigger="click"
      popper-class="!p-0 transform translate-x-1"
    >
      <template #reference>
        <cr-menu-workspace-card
          class="h-14 pl-4 pr-3.5 hover:bg-gray-50"
          :tenant="currentTenant"
          :class="isDropdownOpen ? '!bg-gray-50' : ''"
        >
          <i class="ri-settings-3-line text-lg text-gray-300 transform -translate-x-0.5 block mr-1.5" />
        </cr-menu-workspace-card>
      </template>
      <div>
        <cr-menu-workspace-popover
          @click="popover.hide()"
          @add="addWorkspace = true"
          @edit="editWorkspace = $event"
        />
      </div>
    </el-popover>

    <!-- Create workspace -->
    <app-tenant-new-form
      v-if="addWorkspace"
      v-model="addWorkspace"
      @created-tenant="showTenantCreatedModal = true"
    />
    <app-tenant-created-modal
      v-if="showTenantCreatedModal"
      v-model="showTenantCreatedModal"
    />
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
} from 'vue';
import CrMenuWorkspaceCard from '@/modules/layout/components/menu/workspace/menu-workspace-card.vue';
import CrMenuWorkspacePopover from '@/modules/layout/components/menu/workspace/menu-workspace-popover.vue';

import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import AppTenantNewForm from '@/modules/tenant/components/tenant-new-form.vue';
import AppTenantCreatedModal from '@/modules/tenant/components/tenant-created-modal.vue';
import { TenantModel } from '@/modules/tenant/types/TenantModel';

const isDropdownOpen = ref(false);
const { doFetch } = mapActions('tenant');
const { currentTenant } = mapGetters('auth');

const editWorkspace = ref<TenantModel | null>(null);
const addWorkspace = ref<boolean>(false);
const showTenantCreatedModal = ref<boolean>(false);

const popover = ref<any>(null);

onMounted(() => {
  doFetch({});
});
</script>

<script lang="ts">
export default {
  name: 'CrMenuWorkspace',
};
</script>
