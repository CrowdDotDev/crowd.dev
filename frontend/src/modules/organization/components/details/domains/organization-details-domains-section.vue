<template>
  <section v-if="domainList.length">
    <p class="text-small font-semibold pb-3">
      <slot />
    </p>

    <div class="flex flex-col gap-3">
      <article
        v-for="domain of domainList.slice(0, showMore ? domainList.length : limit)"
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
            Source: {{ platformLabel(domain.platforms) }}
          </p>
        </div>
      </article>
    </div>

    <lf-button
      v-if="domainList.length > limit"
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
import { computed, ref } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { withHttp } from '@/utils/string';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { MemberIdentity } from '@/modules/member/types/Member';

const props = defineProps<{
  domains: OrganizationIdentity[],
}>();

const limit = 5;

const showMore = ref<boolean>(false);

const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);

const domainList = computed(() => {
  const domainData = (props.domains || [])
    .reduce((obj: Record<string, any>, identity: MemberIdentity) => {
      const domainObject = { ...obj };
      if (!(identity.value in domainObject)) {
        domainObject[identity.value] = {
          ...identity,
          platforms: [],
        };
      }
      domainObject[identity.value].platforms.push(identity.platform);
      domainObject[identity.value].verified = domainObject[identity.value].verified || identity.verified;

      return domainObject;
    }, {});
  return Object.keys(domainData).map((domain) => ({
    value: domain,
    ...domainData[domain],
  }));
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsDomainsSection',
};
</script>
