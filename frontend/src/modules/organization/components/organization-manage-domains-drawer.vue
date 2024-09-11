<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit domains"
    custom-class="domains-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="(identity, ii) of domainData" :key="ii">
            <article class="flex items-center">
              <div class="flex-grow">
                <p class="text-xs font-medium gap-1 flex items-center">
                  <span>{{ identity.value }}</span>
                  <lf-verified-identity-badge v-if="identity.verified" />
                </p>
                <p class="mt-0.5 text-tiny text-gray-400">
                  Source: {{ platformLabel(identity.platforms) }}
                </p>
              </div>

              <lf-dropdown placement="bottom-end" width="15rem" class="ml-3">
                <template #trigger>
                  <lf-button
                    type="secondary-ghost-light"
                    size="small"
                    :icon-only="true"
                    class="relative"
                  >
                    <i
                      class="ri-more-fill"
                    />
                  </lf-button>
                </template>
                <lf-dropdown-item
                  @click="emit('unmerge', identity)"
                >
                  <i class="ri-link-unlink" />
                  Unmerge domain
                </lf-dropdown-item>
                <el-tooltip
                  v-if="!identity.verified"
                  content="Identities tracked from Integrations can’t be verified"
                  placement="top-end"
                  :disabled="!isVerifyDisabled(identity)"
                >
                  <lf-dropdown-item
                    :disabled="isVerifyDisabled(identity)"
                    @click="verify(identity.value, true)"
                  >
                    <i class="ri-verified-badge-line" />
                    Verify domain
                  </lf-dropdown-item>
                </el-tooltip>
                <el-tooltip
                  v-else
                  content="Identities tracked from Integrations can’t be unverified"
                  placement="top-end"
                  :disabled="!isVerifyDisabled(identity)"
                >
                  <lf-dropdown-item
                    :disabled="isVerifyDisabled(identity)"
                    @click="verify(identity.value, false)"
                  >
                    <app-svg name="unverify" class="!h-4 !w-4" />
                    Unverify domain
                  </lf-dropdown-item>
                </el-tooltip>
                <lf-dropdown-separator />
                <lf-dropdown-item type="danger" @click="remove(identity.value)">
                  <i class="ri-delete-bin-6-line" />
                  Delete domain
                </lf-dropdown-item>
              </lf-dropdown>
            </article>
          </template>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import {
  ref,
  computed, onUnmounted,
} from 'vue';
import Message from '@/shared/message/message';
import { OrganizationService } from '@/modules/organization/organization-service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import {
  Organization,
  OrganizationIdentity,
  OrganizationIdentityType,
} from '@/modules/organization/types/Organization';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { MemberIdentity } from '@/modules/member/types/Member';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import AppSvg from '@/shared/svg/svg.vue';
import LfVerifiedIdentityBadge from '@/shared/modules/identities/components/verified-identity-badge.vue';

const props = defineProps<{
  modelValue: boolean,
  organization: Organization,
}>();

const emit = defineEmits(['update:modelValue', 'unmerge']);

const { trackEvent } = useProductTracking();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const { domains } = useOrganizationHelpers();
const { fetchOrganization } = useOrganizationStore();

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const platformLabel = (platforms: string[]) => CrowdIntegrations.getPlatformsLabel(platforms);

const isVerifyDisabled = (identity: OrganizationIdentity) => !!identity.sourceId || ['integration', 'lfid'].includes(identity.platform);

const domainsIdentities = ref(domains(props.organization) || []);

const domainData = computed(() => {
  const domainData = domainsIdentities.value
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

const serverUpdate = () => {
  trackEvent({
    key: FeatureEventKey.EDIT_ORGANIZATION_IDENTITY,
    type: EventType.FEATURE,
    properties: {
      identities: domainsIdentities.value.filter((i) => !!i.value.trim()),
    },
  });

  const otherIdentities = props.organization.identities.filter((i) => ![
    OrganizationIdentityType.ALTERNATIVE_DOMAIN,
    OrganizationIdentityType.PRIMARY_DOMAIN,
  ].includes(i.type));

  OrganizationService.update(props.organization.id, {
    identities: [...otherIdentities, ...domainsIdentities.value.filter((i) => !!i.value.trim())],
  }).then(() => {
    fetchOrganization(props.organization.id);
    Message.success('Organization domains updated successfully');
  }).catch((err) => {
    Message.error(err.response.data);
  });
};

const remove = (name: string) => {
  domainsIdentities.value = domainsIdentities.value.filter((i) => i.value !== name);
  serverUpdate();
};
const verify = (name: string, verified: boolean) => {
  domainsIdentities.value = domainsIdentities.value.map((i) => {
    if (i.value === name) {
      return {
        ...i,
        verified,
      };
    }
    return i;
  });
  serverUpdate();
};

onUnmounted(() => {
  if (selectedProjectGroup.value?.id) {
    useOrganizationStore().fetchOrganization(props.organization.id, [selectedProjectGroup.value.id]);
  }
});

</script>

<script lang="ts">
export default {
  name: 'AppOrganizationManageDomainsDrawer',
};
</script>
