<template>
  <app-drawer
    v-model="drawerModel"
    size="600px"
    title="Edit identities"
    custom-class="identities-drawer"
    :show-footer="false"
  >
    <template #content>
      <div class="-mt-8 z-10 pb-6">
        <lf-dropdown width="260px">
          <template #trigger>
            <div class="flex gap-2 text-xs text-primary-500 font-semibold items-center cursor-pointer">
              <i class="ri-add-line text-base" />Add identity
            </div>
          </template>
          <div class="max-h-64 overflow-auto">
            <lf-dropdown-item v-for="platform of platforms" :key="platform.platform" @click="addIdentity(platform.platform)">
              <img :src="platform.image" :alt="platform.name" class="h-4 w-4" />
              <span>{{ platform.name }}</span>
            </lf-dropdown-item>
          </div>
        </lf-dropdown>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="platform of platformsKeys" :key="platform">
            <template v-for="(identity, ii) of identities" :key="ii">
              <template v-if="identity.platform === platform && [OrganizationIdentityType.USERNAME].includes(identity.type)">
                <app-organization-form-identity-item
                  :identity="identity"
                  :organization="props.organization"
                  @update="update(ii, $event)"
                  @unmerge="emit('unmerge', $event)"
                  @remove="remove(ii)"
                />
              </template>
            </template>

            <template v-for="(identity, ai) of addIdentities" :key="ai">
              <template v-if="identity.platform === platform">
                <app-organization-form-identity-item
                  :identity="identity"
                  :organization="props.organization"
                  :actions-disabled="true"
                  @update="create(ai, $event)"
                  @clear="addIdentities.splice(ai, 1)"
                />
              </template>
            </template>
          </template>
        </div>
        <p v-if="hasCustomIdentities" class="text-2xs leading-4.5 tracking-1 text-gray-400 font-semibold pb-4">
          CUSTOM PLATFORMS
        </p>
        <div class="flex flex-col gap-3">
          <template v-for="(identity, ii) of identities" :key="ii">
            <template
              v-if="
                !platformsKeys.includes(identity.platform)
                  && [OrganizationIdentityType.USERNAME].includes(identity.type)"
            >
              <app-organization-form-identity-item
                :identity="identity"
                :organization="props.organization"
                :editable="false"
                @update="update(ii, $event)"
                @unmerge="emit('unmerge', $event)"
                @remove="remove(ii)"
              />
            </template>
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
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { Organization, OrganizationIdentity, OrganizationIdentityType } from '@/modules/organization/types/Organization';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import AppOrganizationFormIdentityItem
  from '@/modules/organization/components/form/identity/organization-form-identity-item.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  organization: Organization
}>(), {
  modelValue: false,
});

const emit = defineEmits(['update:modelValue', 'unmerge', 'reload']);

const { trackEvent } = useProductTracking();

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const drawerModel = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const existingIdentities = computed(() => (props.organization?.identities || []));

const identities = ref<OrganizationIdentity[]>([...existingIdentities.value] as OrganizationIdentity[]);
const addIdentities = ref<OrganizationIdentity[]>([]);

const prefixes: Record<string, string> = {
  github: 'github.com/',
  linkedin: 'linkedin.com/company/',
  twitter: 'twitter.com/',
  crunchbase: 'crunchbase.com/organization/',
};

const platformsKeys = Object.keys(prefixes);
const platforms = platformsKeys.map((key) => ({
  ...CrowdIntegrations.getConfig(key),
  platform: key,
}));

const hasCustomIdentities = computed(() => identities.value
  .some((i) => !platformsKeys.includes(i.platform)
    && [
      OrganizationIdentityType.USERNAME,
    ].includes(i.type)));

const serverUpdate = () => {
  const identityList = identities.value
    .filter((i) => !!i.value?.trim().length);

  trackEvent({
    key: FeatureEventKey.EDIT_ORGANIZATION_IDENTITY,
    type: EventType.FEATURE,
    properties: {
      identities: identityList,
    },
  });

  OrganizationService.update(props.organization.id, {
    identities: identityList,
  }).then(() => {
    Message.success('Identity updated successfully');
    emit('reload');
  }).catch((err) => {
    Message.error(err.response.data);
  });
};

const update = (index: number, data: OrganizationIdentity) => {
  identities.value[index] = data;
  serverUpdate();
};

const remove = (index: number) => {
  identities.value.splice(index, 1);
  serverUpdate();
};

const create = (index: number, data: OrganizationIdentity) => {
  identities.value.push(data);
  addIdentities.value.splice(index, 1);
  serverUpdate();
};

const addIdentity = (platform: Platform) => {
  addIdentities.value.push({
    platform,
    value: '',
    type: OrganizationIdentityType.USERNAME,
    verified: true,
  });
};
onUnmounted(() => {
  if (selectedProjectGroup.value?.id) {
    useOrganizationStore().fetchOrganization(props.organization.id, [selectedProjectGroup.value.id]);
  }
});
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationManageIdentitiesDrawer',
};
</script>
