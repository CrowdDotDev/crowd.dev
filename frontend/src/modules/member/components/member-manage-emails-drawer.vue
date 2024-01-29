<template>
  <app-drawer
    v-model="drawerModel"
    size="480px"
    title="Edit emails"
    custom-class="emails-drawer"
  >
    <template #content>
      <div class="border-t border-gray-200 -mt-4 -mx-6 px-6 pt-5">
        <p class="text-sm font-medium text-gray-900 mb-2">
          Email address
        </p>
        <app-member-form-emails v-model="memberModel" @update:model-value="hasFormChanged = true" />
      </div>
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
          :disabled="$v.$invalid || !hasFormChanged || loading"
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
import { computed, onMounted, ref } from 'vue';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import cloneDeep from 'lodash/cloneDeep';
import AppMemberFormEmails from '@/modules/member/components/form/member-form-emails.vue';
import useVuelidate from '@vuelidate/core';

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

const memberModel = ref(cloneDeep(props.member));
const loading = ref(false);

const $v = useVuelidate({}, memberModel);

const hasFormChanged = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;
  MemberService.update(props.member.id, {
    emails: memberModel.value.emails,
  }).then(() => {
    store.dispatch('member/doFind', props.member.id).then(() => {
      Message.success('Contact identities updated successfully');
    });
  }).catch((err) => {
    Message.error(err.response.data);
  }).finally(() => {
    loading.value = false;
  });
  emit('update:modelValue', false);
};

onMounted(() => {
  formSnapshot();
});
</script>

<script>
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
