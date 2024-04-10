<template>
  <app-drawer
    v-model="drawerModel"
    size="600px"
    title="Edit identities"
    custom-class="identities-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mt-4 -mx-6 px-6">
        <app-member-form-identities
          v-model="memberModel"
          :record="member"
          :show-header="false"
          :show-unmerge="true"
          @unmerge="emit('unmerge', $event)"
        />
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--secondary mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          :disabled="loading || !hasFormChanged"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="handleSubmit"
        >
          Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  ref,
  computed,
  h,
} from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import cloneDeep from 'lodash/cloneDeep';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import isEqual from 'lodash/isEqual';
import { useMemberStore } from '@/modules/member/store/pinia';
import AppMemberFormIdentities from './form/member-form-identities.vue';

const store = useStore();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  member: {
    type: Object,
    default: () => {},
  },
});
const emit = defineEmits(['update:modelValue', 'unmerge']);

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const memberStore = useMemberStore();

const memberModel = ref(cloneDeep(props.member));
const loading = ref(false);

const hasFormChanged = computed(() => {
  const currentEmails = props.member.identities.filter((i) => i.type === 'username' && !!i.value);
  const formEmails = memberModel.value.identities.filter((i) => i.type === 'username' && !!i.value);
  return !isEqual(currentEmails, formEmails);
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;

  const segments = props.member.segments.map((s) => s.id);

  MemberService.update(props.member.id, {
    identities: memberModel.value.identities.filter((i) => !!i.value),
  }, segments).then(() => {
    store.dispatch('member/doFind', {
      id: props.member.id,
      segments: [selectedProjectGroup.value?.id],
    }).then(() => {
      Message.success('Contributor identities updated successfully');
    });
  }).catch((error) => {
    if (error.response.status === 409) {
      Message.error(
        h(
          'div',
          {
            class: 'flex flex-col gap-2',
          },
          [
            h(
              'el-button',
              {
                class: 'btn btn--xs btn--secondary !h-6 !w-fit',
                onClick: () => {
                  const { memberId, grandParentId } = error.response.data;

                  memberStore.addToMergeMember(memberId, grandParentId);
                  Message.closeAll();
                },
              },
              'Merge members',
            ),
          ],
        ),
        {
          title: 'Member was not updated because the identity already exists in another member.',
        },
      );
    } else {
      Errors.handle(error);
    }
  }).finally(() => {
    emit('update:modelValue', false);
    loading.value = false;
  });
};
</script>

<script>
export default {
  name: 'AppMemberManageIdentitiesDrawer',
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
