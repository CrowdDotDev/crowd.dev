<template>
  <div class="flex items-center">
    <div>
      <lf-tooltip v-if="props.attribute.type === 'email'" content="Email" placement="top-start">
        <app-platform-icon platform="emails" size="small" />
      </lf-tooltip>
      <lf-tooltip v-else-if="platform(props.attribute.platform)" placement="top-start" :content="platform(props.attribute.platform).name">
        <img
          :src="platform(props.attribute.platform)?.image"
          class="h-5 w-5 object-contain"
          :alt="props.attribute.value"
        />
      </lf-tooltip>
      <lf-tooltip v-else content="Custom identity" placement="top-start">
        <lf-icon
          name="fingerprint-fill"
          :size="20"
          class="text-gray-600"
        />
      </lf-tooltip>
    </div>
    <p class="text-medium pl-2 max-w-60 truncate" :title="props.attribute.value">
      {{ props.attribute.value }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';
import { OrganizationIdentity } from '@/modules/organization/types/Organization';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppPlatformIcon from '@/shared/modules/platform/components/platform-icon.vue';

const props = defineProps<{
  attribute: ContributorIdentity | OrganizationIdentity
}>();

const platform = (name: string) => CrowdIntegrations.getConfig(name);
</script>
