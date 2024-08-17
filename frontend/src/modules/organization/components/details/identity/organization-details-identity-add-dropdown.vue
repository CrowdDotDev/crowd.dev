<template>
  <lf-dropdown v-bind="$attrs" width="232px">
    <template #trigger>
      <slot />
    </template>
    <lf-dropdown-item
      v-for="platform in platforms"
      :key="platform.key"
      @click="emit('add', {
        platform: platform.key,
      })"
    >
      <div class="w-full flex items-center gap-2">
        <img :src="platform.image" :alt="platform.key" class="h-4 w-4 object-contain" /> {{ platform.name || platform.key }}
      </div>
    </lf-dropdown-item>
  </lf-dropdown>
</template>

<script setup lang="ts">
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { OrganizationIdentity } from '@/modules/organization/types/Organization';

const emit = defineEmits<{(e: 'add', value: Partial<OrganizationIdentity>): void}>();

const platforms = Object.entries({
  ...CrowdIntegrations.organizationIdentities,
})
  .map(([key, config]) => ({
    ...config,
    key,
  }));
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsIdentityAddDropdown',
};
</script>
