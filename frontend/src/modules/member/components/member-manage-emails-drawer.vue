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
          class="flex gap-2 text-xs text-brand-500 font-semibold items-center cursor-pointer"
          @click="addIdentity()"
        >
          <i class="ri-add-line text-base" />Add email
        </div>
      </div>
      <div class="border-t border-gray-200 -mx-6 px-6">
        <div class="gap-4 flex flex-col pt-6 pb-10">
          <template v-for="(identity, email) of distinctEmails" :key="email">
            <template v-if="identity.type === 'email'">
              <app-member-form-email-item
                :identity="identity"
                :member="props.member"
                @update="update(email, $event)"
                @remove="remove(email)"
              />
            </template>
          </template>

          <template v-for="(identity, ai) of addIdentities" :key="ai">
            <app-member-form-email-item
              :identity="identity"
              :member="props.member"
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
import { useStore } from 'vuex';
import { computed, onUnmounted, ref } from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import AppMemberFormEmailItem from '@/modules/member/components/form/email/member-form-email-item.vue';

const props = defineProps<{
  modelValue: boolean,
  member: Member,
}>();

const emit = defineEmits(['update:modelValue']);

const store = useStore();
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

const identities = ref<MemberIdentity[]>([...(props.member.identities || [])]);
const addIdentities = ref<MemberIdentity[]>([]);

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
  const segments = props.member.segments.map((s) => s.id);

  MemberService.update(props.member.id, {
    identities: identities.value.filter((i) => !!i.value),
  }, segments)
    .catch((err) => {
      Message.error(err.response.data);
    });
};

const update = (email: string, data: MemberIdentity) => {
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

const create = (index: number, data: MemberIdentity) => {
  identities.value.push({
    ...addIdentities.value[index],
    ...data,
  });
  addIdentities.value.splice(index, 1);
  serverUpdate();
};

const addIdentity = () => {
  addIdentities.value.push({
    platform: 'custom',
    type: 'email',
    value: '',
    verified: true,
    sourceId: null,
  });
};

onUnmounted(() => {
  store.dispatch('member/doFind', {
    id: props.member.id,
    segments: [selectedProjectGroup.value?.id],
  });
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberManageEmailsDrawer',
};
</script>

<style lang="scss">
.identities-drawer {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}
</style>
