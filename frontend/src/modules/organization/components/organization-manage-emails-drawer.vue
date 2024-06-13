<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit emails"
    custom-class="emails-drawer"
    :show-footer="false"
  >
    <template #content>
      <div class="-mt-8 z-10 pb-6">
        <div
          class="flex gap-2 text-xs text-primary-500 font-semibold items-center cursor-pointer"
          @click="addIdentity()"
        >
          <i class="ri-add-line text-base" />Add email
        </div>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="(identity, email) of distinctEmails" :key="email">
            <template v-if="identity.type === 'email'">
              <app-organization-form-email-item
                :identity="identity"
                :organization="props.organization"
                @update="update(email, $event)"
                @remove="remove(email)"
              />
            </template>
          </template>

          <template v-for="(identity, ai) of addIdentities" :key="ai">
            <app-organization-form-email-item
              :identity="identity"
              :organization="props.organization"
              :actions-disabled="true"
              @update="create(ai, $event)"
              @clear="addIdentities.splice(ai, 1)"
            />
          </template>
        </div>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import Message from '@/shared/message/message';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { Organization, OrganizationIdentity, OrganizationIdentityType } from '@/modules/organization/types/Organization';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppOrganizationFormEmailItem
  from '@/modules/organization/components/form/email/organization-form-email-item.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { OrganizationService } from '../organization-service';

const props = defineProps<{
  modelValue: boolean,
  organization: Organization,
}>();

const emit = defineEmits(['update:modelValue']);

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

const identities = ref<OrganizationIdentity[]>([...(props.organization.identities || [])]);
const addIdentities = ref<OrganizationIdentity[]>([]);

const distinctEmails = computed(() => identities.value
  .filter((identity) => identity.type === 'email')
  .reduce((obj: Record<string, any>, identity: any) => {
    const emailObject = { ...obj };
    if (!(identity.value in emailObject)) {
      emailObject[identity.value] = {
        ...identity,
        platforms: [],
      };
    }
    emailObject[identity.value].platforms.push(identity.platform);
    emailObject[identity.value].verified = emailObject[identity.value].verified || identity.verified;

    return emailObject;
  }, {}));

const serverUpdate = () => {
  trackEvent({
    key: FeatureEventKey.EDIT_CONTRIBUTOR_EMAIL,
    type: EventType.FEATURE,
    properties: {
      identities: identities.value.filter((i) => !!i.value),
    },
  });

  OrganizationService.update(props.organization.id, {
    identities: identities.value.filter((i) => !!i.value),
  })
    .catch((err) => {
      Message.error(err.response.data);
    });
};

const update = (email: string, data: OrganizationIdentity) => {
  identities.value = identities.value.map((i) => {
    if (i.value === email) {
      return {
        ...i,
        ...data,
      };
    }
    return i;
  });
  serverUpdate();
};

const remove = (email: string) => {
  identities.value = identities.value.filter((i) => i.value !== email);
  serverUpdate();
};

const create = (index: number, data: OrganizationIdentity) => {
  identities.value.push({
    ...addIdentities.value[index],
    ...data,
  });
  addIdentities.value.splice(index, 1);
  serverUpdate();
};

const addIdentity = () => {
  addIdentities.value.push({
    platform: Platform.CUSTOM,
    type: OrganizationIdentityType.EMAIL,
    value: '',
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
  name: 'AppOrganizationManageEmailsDrawer',
};
</script>
