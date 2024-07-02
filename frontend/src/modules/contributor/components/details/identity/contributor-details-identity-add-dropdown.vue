<template>
  <lf-dropdown v-bind="$attrs" width="232px">
    <template #trigger>
      <slot />
    </template>
    <div class="max-h-60 overflow-auto -m-2 p-2">
      <lf-dropdown-item
        v-for="platform of platforms"
        :key="platform.platform"
        @click="emit('add', {
          platform: platform.platform,
        })"
      >
        <div class="w-full flex items-center gap-2">
          <img :src="platform.image" :alt="platform.platform" class="h-4 w-4" /> {{ platform.name }}
        </div>
      </lf-dropdown-item>
      <lf-dropdown-separator />
      <lf-dropdown-item
        @click="emit('add', {
          platform: 'custom',
          type: 'email',
        })"
      >
        <div class="w-full flex items-center gap-2">
          <lf-icon name="mail-line" :size="16" /> Email
        </div>
      </lf-dropdown-item>
    </div>
  </lf-dropdown>
</template>

<script setup lang="ts">
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';

const platforms = CrowdIntegrations.enabledConfigs;

const emit = defineEmits<{(e: 'add', value: Partial<ContributorIdentity>): void}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentityAddDropdown',
};
</script>
