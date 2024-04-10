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
        <cr-dropdown width="260px">
          <template #trigger>
            <div class="flex gap-2 text-xs text-brand-500 font-semibold items-center cursor-pointer">
              <i class="ri-add-line text-base" />Add identity
            </div>
          </template>
          <div class="max-h-64 overflow-auto">
            <cr-dropdown-item v-for="platform of platforms" :key="platform.platform" @click="addIdentity(platform.platform)">
              <img :src="platform.image" :alt="platform.name" class="h-4 w-4" />
              <span>{{ platform.name }}</span>
            </cr-dropdown-item>
          </div>
        </cr-dropdown>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="platform of platformsKeys" :key="platform">
            <template v-for="(identity, ii) of identities" :key="ii">
              <template v-if="identity.platform === platform">
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
            <template v-if="!platformsKeys.includes(identity.platform)">
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
import cloneDeep from 'lodash/cloneDeep';
import AppOrganizationFormIdentities from '@/modules/organization/components/form/organization-form-identities.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import AppOrganizationFormIdentityItem
  from '@/modules/organization/components/form/identity/organization-form-identity-item.vue';

const props = withDefaults(defineProps<{
  modelValue?: boolean,
  organization: Organization
}>(), {
  modelValue: false,
});

const emit = defineEmits(['update:modelValue', 'unmerge']);

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
const { fetchOrganization } = useOrganizationStore();

const drawerModel = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const existingIdentities = computed(() => (props.organization?.identities || []).map((i) => ({
  ...i,
  username: i.url ? i.url.split('/').at(-1) : '',
})));

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
  platform: key
}));
const hasCustomIdentities = computed(() => identities.value.some((i) => !platformsKeys.includes(i.platform)));

const serverUpdate = () => {
  const identityList = identities.value
    .filter((i) => !platformsKeys.includes(i.platform) || !!i.username?.trim().length)
    .map((i) => {
      const existingOnes = existingIdentities.value.filter((id) => id.platform === i.platform);
      const index = identities.value
        .filter((id) => id.platform === i.platform)
        .findIndex((id) => id.username === i.username);
      const existingOne = index >= 0 ? existingOnes[index] : null;
      return {
        ...i,
        name: !existingOne || existingOne.username !== i.username ? i.username || i.name : i.name,
        url: i.username?.length ? `https://${prefixes[i.platform]}${i.username}` : null,
      };
    });
  OrganizationService.update(props.organization.id, {
    identities: identityList,
  }).then(() => {
    Message.success('Identity updated successfully');
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

const addIdentity = (platform: string) => {
  addIdentities.value.push({
    platform,
    url: '',
    username: '',
    name: '',
  });
};
onUnmounted(() => {
  fetchOrganization(props.organization.id, [selectedProjectGroup.value?.id]);
});
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationManageIdentitiesDrawer',
};
</script>
