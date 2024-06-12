<template>
  <section v-if="props.domains.length">
    <p class="text-small font-semibold pb-3">
      <slot />
    </p>

    <article
      v-for="domain of props.domains.slice(0, showMore ? props.domains.length : limit)"
      :key="domain"
      class="flex"
    >
      <lf-icon name="link" :size="20" class="text-gray-500" />
      <div class="pl-2">
        <div class="flex items-center">
          <lf-tooltip
            :content="domain.value"
            :disabled="domain.value.length < 25"
          >
            <a
              :href="withHttp(domain.value)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 truncate"
              style="max-width: 25ch"
            >
              {{ domain.value }}
            </a>
          </lf-tooltip>
          <lf-tooltip v-if="!domain.verified" content="Verified domain" class="ml-1.5">
            <lf-icon name="verified-badge-line" :size="16" class="text-primary-500" />
          </lf-tooltip>
        </div>
        <p class="mt-1.5 text-tiny text-gray-400">
          Source: {{ platformLabel(domain.platform) }}
        </p>
      </div>
    </article>

    <lf-button
      v-if="domains.length > limit"
      type="primary-link"
      size="small"
      class="mt-4"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
</template>

<script setup lang="ts">
import { OrganizationIdentity } from '@/modules/organization/types/Organization';
import LfButton from '@/ui-kit/button/Button.vue';
import { ref } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { withHttp } from '@/utils/string';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps<{
  domains: OrganizationIdentity[],
}>();

const limit = 5;

const showMore = ref<boolean>(false);

const platformLabel = (platform: string) => CrowdIntegrations.getPlatformsLabel([platform]);
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsDomainsSection',
};
</script>
