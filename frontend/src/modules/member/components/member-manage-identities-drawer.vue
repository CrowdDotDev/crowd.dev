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
          @update:model-value="hasFormChanged = true"
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
          :disabled="loading"
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
} from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import cloneDeep from 'lodash/cloneDeep';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
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

const memberModel = ref(cloneDeep(props.member));
const loading = ref(false);

const hasFormChanged = ref(false);

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
  }).catch((err) => {
    Message.error(err.response.data);
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
