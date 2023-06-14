<template>
  <app-drawer
    v-model="drawerModel"
    size="35%"
    title="Edit identities"
    custom-class="identities-drawer"
  >
    <template #content>
      <el-form :model="memberModel">
        <app-member-form-identities
          v-model="memberModel"
          :record="member"
          :show-header="false"
        />
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="handleCancel"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          :disabled="isSubmitBtnDisabled || loading"
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
  defineEmits,
  defineProps,
  computed,
  reactive,
} from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import cloneDeep from 'lodash/cloneDeep';
import { MemberModel } from '@/modules/member/member-model';
import { FormSchema } from '@/shared/form/form-schema';
import isEqual from 'lodash/isEqual';
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
const emit = defineEmits(['update:modelValue']);

const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const memberModel = reactive(cloneDeep(props.member));
const loading = ref(false);

const { fields } = MemberModel;
const formSchema = computed(
  () => new FormSchema([
    fields.username,
  ]),
);
const isFormValid = computed(() => formSchema.value.isValidSync(memberModel));
const hasFormChanged = computed(() => !isEqual(cloneDeep(props.member), memberModel));
const isSubmitBtnDisabled = computed(
  () => !isFormValid.value || !hasFormChanged.value,
);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;

  const segments = props.member.segments.map((s) => s.id);

  MemberService.update(props.member.id, {
    attributes: memberModel.attributes,
    username: memberModel.username,
    emails: memberModel.emails,
  }, segments).then(() => {
    store.dispatch('member/doFind', { id: props.member.id }).then(() => {
      Message.success('Member identities updated successfully');
    });
  }).catch((err) => {
    Message.error(err.response.data);
  }).finally(() => {
    loading.value = false;
  });
  emit('update:modelValue', false);
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
