<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit emails"
    custom-class="emails-drawer"
  >
    <template #content>
      <div class="-mt-8 z-10 pb-6">
        <div
          class="flex gap-2 text-xs text-brand-500 font-semibold items-center cursor-pointer text-primary-500"
          @click="addEmail()"
        >
          <i class="ri-add-line text-base" />Add email
        </div>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="(email, ii) of emails" :key="ii">
            <app-organization-form-email-item
              :email="email"
              :organization="props.organization"
              @update="update(ii, $event)"
              @remove="remove(ii)"
            />
          </template>
          <template v-for="(email, ai) of addEmails" :key="ai">
            <app-organization-form-email-item
              :email="email"
              :organization="props.organization"
              :actions-disabled="true"
              @update="create(ai, $event)"
              @clear="addEmails.splice(ai, 1)"
            />
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
import { Organization } from '@/modules/organization/types/Organization';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppOrganizationFormEmailItem
  from '@/modules/organization/components/form/email/organization-form-email-item.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';

const props = defineProps<{
  modelValue: boolean,
  organization: Organization,
}>();
const emit = defineEmits(['update:modelValue', 'reload']);
const { trackEvent } = useProductTracking();
const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
const { fetchOrganization } = useOrganizationStore();
const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const emails = ref<string[]>([...(props.organization.emails || [])]);
const addEmails = ref<string[]>([]);
const serverUpdate = () => {
  trackEvent({
    key: FeatureEventKey.EDIT_ORGANIZATION_EMAIL_DOMAIN,
    type: EventType.FEATURE,
    properties: {
      emails: emails.value.filter((e) => !!e.trim()),
    },
  });
  OrganizationService.update(props.organization.id, {
    emails: emails.value.filter((e) => !!e.trim()),
  }).then(() => {
    Message.success('Organization email updated successfully');
    emit('reload');
  }).catch((err) => {
    Message.error(err.response.data);
  });
};
const update = (index: number, data: string) => {
  emails.value[index] = data;
  serverUpdate();
};
const remove = (index: number) => {
  emails.value.splice(index, 1);
  serverUpdate();
};
const create = (index: number, data: string) => {
  emails.value.push(data);
  addEmails.value.splice(index, 1);
  serverUpdate();
};
const addEmail = () => {
  addEmails.value.push('');
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
