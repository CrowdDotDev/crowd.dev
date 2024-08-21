<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit emails"
    custom-class="emails-drawer"
  >
    <template #content>
      <div class="-mt-4 border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="(identity, ii) of emailList" :key="ii">
            <app-organization-form-email-item
              :email="identity"
              :organization="props.organization"
              @update="update(identity.value, $event)"
              @unmerge="emit('unmerge', $event)"
              @remove="remove(identity.value)"
            />
          </template>
        </div>
      </div>
    </template>
  </app-drawer>
</template>
<script setup lang="ts">
import {
  computed, onUnmounted, ref,
} from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { Organization, OrganizationIdentity } from '@/modules/organization/types/Organization';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppOrganizationFormEmailItem
  from '@/modules/organization/components/form/email/organization-form-email-item.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import useOrganizationHelpers from '@/modules/organization/helpers/organization.helpers';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { OrganizationService } from '@/modules/organization/organization-service';
import Message from '@/shared/message/message';
import { Platform } from '@/shared/modules/platform/types/Platform';

const props = defineProps<{
  modelValue: boolean,
  organization: Organization,
}>();
const emit = defineEmits(['update:modelValue', 'unmerge', 'reload']);
const { trackEvent } = useProductTracking();
const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
const { fetchOrganization } = useOrganizationStore();
const { emails } = useOrganizationHelpers();
const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const emailList = computed(() => emails(props.organization));
const identities = ref<OrganizationIdentity[]>(props.organization.identities);

const serverUpdate = () => {
  trackEvent({
    key: FeatureEventKey.EDIT_ORGANIZATION_EMAIL_DOMAIN,
    type: EventType.FEATURE,
    properties: {
      identities: identities.value,
    },
  });
  OrganizationService.update(props.organization.id, {
    identities: identities.value,
  }).then(() => {
    Message.success('Organization email updated successfully');
    emit('reload');
  }).catch((err) => {
    Message.error(err.response.data);
  });
};
const update = (email: string, data: Partial<OrganizationIdentity>) => {
  identities.value = identities.value.map((i) => {
    if (i.value === email) {
      return {
        ...i,
        ...data,
        verified: false,
        sourceId: null,
        organizationId: null,
        platform: Platform.CUSTOM,
      };
    }
    return i;
  });
  serverUpdate();
};
const remove = (email: string) => {
  identities.value = identities.value.filter((i) => !(i.type === 'email' && i.value === email));
  serverUpdate();
};
onUnmounted(() => {
  fetchOrganization(props.organization.id, [selectedProjectGroup.value?.id]);
});
</script>
<script lang="ts">
export default {
  name: 'AppOrganizationManageEmailsDrawer',
};
</script>
