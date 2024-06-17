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
          <template v-for="(identity, ii) of domainsIdentities" :key="ii">
            <article class="flex items-center">
              <div class="flex-grow text-xs font-medium gap-1 flex items-center">
                <span>{{ identity.value }}</span>
                <span v-if="identity.verified">
                  <el-tooltip placement="top" content="Verified identity">
                    <i class="ri-verified-badge-fill text-primary-500" />
                  </el-tooltip>
                </span>
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

                <lf-dropdown-item type="danger" @click="remove(ii)">
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
import { Organization, OrganizationIdentity, OrganizationIdentityType } from '@/modules/organization/types/Organization';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfButton from '@/ui-kit/button/Button.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';

const props = defineProps<{
  modelValue: boolean,
  organization: Organization,
}>();

const emit = defineEmits(['update:modelValue', 'reload']);

const { trackEvent } = useProductTracking();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const domainsIdentities = ref<OrganizationIdentity[]>(
  [...(props.organization.identities.filter((i) => [
    OrganizationIdentityType.ALTERNATIVE_DOMAIN,
    OrganizationIdentityType.PRIMARY_DOMAIN,
  ].includes(i.type)) || [])],
);

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
    emit('reload');
    Message.success('Organization domains updated successfully');
  }).catch((err) => {
    Message.error(err.response.data);
  });
};

const remove = (index: number) => {
  domainsIdentities.value.splice(index, 1);
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
