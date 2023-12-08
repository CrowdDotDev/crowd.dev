<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <div class="font-medium text-black">
            Identities
          </div>
          <el-tooltip placement="top">
            <template #content>
              Identities can be profiles on social platforms, emails,<br>
              or unique identifiers from internal sources.
            </template>
            <span>
              <i class="ri-information-line text-xs" />
            </span>
          </el-tooltip>
        </div>
      </div>
      <div class="-mx-6 mt-6">
        <template v-if="props.organization.identities && props.organization.identities.length > 0">
          <a
            v-for="(identity, ii) of organization.identities"
            :key="ii"
            class="px-6 py-2 flex justify-between items-center relative transition-colors"
            :class="getIdentityLink(identity) ? ' hover:bg-gray-50 cursor-pointer' : ''"
            :href="getIdentityLink(identity)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="flex gap-3 items-center">
              <app-platform :show-tooltip="true" :platform="identity.platform" custom-platform-icon-class="ri-community-fill" />
              <span class="text-gray-900 text-xs">
                {{ getPlatformDetails(identity.platform)?.organization.handle(identity)
                  ?? identity.name
                  ?? getPlatformDetails(identity.platform)?.name
                  ?? identity.platform }}</span>
            </div>
            <i
              v-if="identity.url"
              class="ri-external-link-line text-gray-300"
            />
          </a>
        </template>

        <el-divider
          v-if="showDivider"
          class="border-t-gray-200"
        />
        <a
          v-for="email of organization.emails"
          :key="email"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`mailto:${email}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="email" />
            <span class="text-gray-900 text-xs">
              {{ email }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>
        <a
          v-for="phone of organization.phoneNumbers"
          :key="phone"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`tel:${phone}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="phone" />
            <span class="text-gray-900 text-xs">
              {{ phone }}</span>
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          />
        </a>

        <div
          v-if="noIdentities"
          class="text-sm text-gray-600 px-6 pt-2"
        >
          <router-link
            :to="{
              name: 'organizationEdit',
              params: { id: organization.id },
            }"
          >
            Add identities
          </router-link>
        </div>
      </div>

      <div v-if="shouldShowAttributes">
        <div class="mt-10">
          <div class="font-medium text-black">
            Attributes
          </div>

          <app-organization-aside-enriched
            :organization="organization"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import enrichmentAttributes from '@/modules/organization/config/enrichment';
import { withHttp } from '@/utils/string';
import { AttributeType } from '@/modules/organization/types/Attributes';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppPlatform from '@/shared/platform/platform.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import Plans from '@/security/plans';
import AppOrganizationAsideEnriched from './_aside/_aside-enriched.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant } = mapGetters('auth');

const showDivider = computed(
  () => (!!props.organization.emails?.length
      || !!props.organization.phoneNumbers?.length)
    && (!!props.organization.github
      || !!props.organization.linkedin
      || !!props.organization.twitter
      || !!props.organization.crunchbase
      || !!props.organization.facebook),
);

const noIdentities = computed(() => (
  !props.organization.github?.url
    && !props.organization.linkedin?.url
    && !props.organization.twitter?.url
    && !props.organization.crunchbase?.url
    && !props.organization.facebook?.url
    && (!props.organization.emails
      || props.organization.emails.length === 0)
    && (!props.organization.phoneNumbers
      || props.organization.phoneNumbers.length === 0)
));

const shouldShowAttributes = computed(() => {
  if (currentTenant.value.plan === Plans.values.essential) {
    return true;
  }
  return enrichmentAttributes.some((a) => {
    if (a.type === AttributeType.ARRAY) {
      return !!props.organization[a.name]?.length;
    }

    return !!props.organization[a.name];
  });
});

const getPlatformDetails = (platform) => CrowdIntegrations.getConfig(platform);

const getIdentityLink = (identity) => {
  if (identity.url) {
    return withHttp(identity.url);
  }
  return null;
};
</script>

<script>
export default {
  name: 'AppOrganizationViewAside',
};
</script>
