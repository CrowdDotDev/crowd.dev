<template>
  <div>
    <div class="max-h-[40rem] overflow-auto">
      <!-- Workspace list -->
      <section v-for="(tenant, ti) of tenants" :key="tenant.id">
        <div v-if="ti > 0" class="my-1 border-b border-gray-200" />
        <div class="p-2">
          <cr-menu-workspace-card class="h-14 px-3 hover:bg-gray-50" :tenant="tenant" @click="doSwitchTenant(tenant)">
            <i v-if="currentTenant.id === tenant.id" class="ri-check-line text-lg text-black" />
          </cr-menu-workspace-card>
          <div v-if="currentTenant.id === tenant.id" class="pt-1 -mx-1">
            <cr-menu-links
              :collapsed="false"
              :links="tenantMenu"
              :disable-active-class="true"
              link-class="!p-3 !h-10 !mb-0 !mt-1 !text-xs"
            />
            <div v-if="hasPermissionsForSettings" class="px-1">
              <div class="p-3 h-10 text-xs text-black mt-1 rounded hover:bg-gray-50 cursor-pointer" @click.stop="emit('edit', tenant)">
                Edit workspace
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Add workspace -->
      <section
        class="border-b border-gray-100"
        :class="{
          'px-2 pb-3': hasPermissionsForSettings,
        }"
      >
        <div
          v-if="hasPermissionsForSettings"
          class="px-3 h-10 text-sm font-normal rounded hover:bg-gray-50 cursor-pointer flex items-center text-brand-500"
          @click="emit('add')"
        >
          <i class="ri-add-fill text-base text-brand-500 mr-3" />
          <span>Add workspace</span>
        </div>
      </section>
    </div>

    <!-- User settings -->
    <section class="px-2 pb-2 pt-1">
      <!-- User details -->
      <div class="p-3 flex items-center">
        <app-avatar
          :entity="{
            avatar: currentUserAvatar,
            displayName: currentUser.email,
          }"
          size="xxs"
        />
        <div class="pl-3 font-medium leading-5 text-2xs">
          {{ currentUser.email }}
        </div>
      </div>

      <div
        v-if="developerModeEnabled()"
        class="px-3 h-10 text-sm font-normal rounded flex items-center justify-between text-purple-600"
        @click.stop.prevent
      >
        <div>
          <i class="ri-code-s-slash-line text-base text-purple-700 mr-3" />
          <span>Developer Mode</span>
        </div>
        <div>
          <el-switch
            v-model="isDeveloperModeActive"
            size="small"
            class="custom-switch"
            @change="updateDeveloperMode"
          />
        </div>
      </div>

      <!-- Account settings -->
      <router-link
        :to="{ name: 'editProfile' }"
        class="px-3 h-10 text-sm font-normal rounded hover:bg-gray-50 cursor-pointer flex items-center text-black"
      >
        <i class="ri-account-circle-line text-base text-gray-400 mr-3" />
        <span class="text-black">Account settings</span>
      </router-link>

      <!-- Sign out -->
      <div
        class="px-3 h-10 text-sm font-normal rounded hover:bg-gray-50 cursor-pointer flex items-center text-black"
        @click="doSignout()"
      >
        <i class="ri-logout-box-r-line text-base text-gray-400 mr-3" />
        <span>Sign out</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import CrMenuWorkspaceCard from '@/modules/layout/components/menu/workspace/menu-workspace-card.vue';
import { TenantModel } from '@/modules/tenant/types/TenantModel';
import CrMenuLinks from '@/modules/layout/components/menu/menu-links.vue';
import { tenantMenu } from '@/modules/layout/config/menu';
import { computed } from 'vue';
import { useUserStore } from '@/modules/user/store/pinia';
import { storeToRefs } from 'pinia';
import { FeatureFlag } from '@/utils/featureFlag';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';

const emit = defineEmits<{(e:'add'): any, (e: 'edit', value: TenantModel): any}>();

const { rows } = mapGetters('tenant');
const { currentTenant, currentUser, currentUserAvatar } = mapGetters('auth');
const { doSelectTenant, doSignout } = mapActions('auth');

const userStore = useUserStore();
const { isDeveloperModeActive } = storeToRefs(userStore);
const { updateDeveloperMode } = userStore;

const hasPermissionsForSettings = computed(
  () => {
    const settingsPermissions = new SettingsPermissions(
      currentTenant.value,
      currentUser.value,
    );

    return settingsPermissions.edit || settingsPermissions.lockedForCurrentPlan;
  },
);

const tenants = computed<TenantModel[]>(() => {
  const currentTenantId = currentTenant.value.id;
  const restTenants = rows.value.filter((ten: TenantModel) => ten.id !== currentTenantId)
    .sort((a: TenantModel, b: TenantModel) => a.name.localeCompare(b.name));
  return [currentTenant.value, ...restTenants];
});

const doSwitchTenant = (tenant: TenantModel) => {
  doSelectTenant({ tenant, immediate: true });
};

const developerModeEnabled = () => FeatureFlag.isFlagEnabled(
  FeatureFlag.flags.developerMode,
);
</script>

<script lang="ts">
export default {
  name: 'CrMenuWorkspacePopover',
};
</script>

<style lang="scss">
.custom-switch.el-switch.is-checked .el-switch__core {
    @apply bg-purple-500 border-purple-500;
}
</style>
