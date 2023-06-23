<template>
  <!-- This drawer is too customized to use the app-drawer generic component -->
  <el-drawer
    v-model="drawerModel"
    size="35%"
    :show-close="false"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    :custom-class="
      isEditingAttributes
        ? 'edit-attribute-drawer'
        : 'manage-attribute-drawer'
    "
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="flex grow justify-between items-center">
        <div>
          <el-button
            v-if="isEditingAttributes"
            class="btn btn-link btn-link--md btn-link--secondary mb-2"
            @click="onCloseManageAttributes"
          >
            <i class="ri-arrow-left-s-line" /><span>Edit attributes</span>
          </el-button>
          <h5
            :id="titleId"
            class="text-black"
            :class="titleClass"
          >
            {{
              !isEditingAttributes
                ? 'Edit attributes'
                : 'Manage global attributes'
            }}
          </h5>
          <el-button
            v-if="!isEditingAttributes"
            class="btn btn-link btn-link--sm btn-link--primary"
            @click="onOpenManageAttributes"
          >
            Manage global attributes
          </el-button>
        </div>

        <el-button
          class="btn btn--transparent btn--xs w-8 !h-8"
          @click="close"
        >
          <i
            class="ri-close-line text-lg text-gray-400"
          />
        </el-button>
      </div>
    </template>
    <template #default>
      <div v-if="!isEditingAttributes">
        <app-member-form-attributes
          v-model="memberModel"
          :show-header="false"
          :attributes="computedAttributes"
          :record="member"
        />
      </div>
      <app-member-form-global-attributes
        v-else
        v-model="isEditingAttributes"
      />
    </template>
    <template v-if="!isEditingAttributes" #footer>
      <div
        class="flex w-full justify-end"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button
          v-if="hasFormChanged"
          class="btn btn-link btn-link--primary"
          @click="handleReset"
        >
          <i class="ri-arrow-go-back-line" />
          <span>Reset changes</span>
        </el-button>
        <div class="flex gap-4">
          <el-button
            :disabled="loading"
            class="btn btn--md btn--bordered"
            @click="handleCancel"
          >
            Cancel
          </el-button>
          <el-button
            :disabled="!hasFormChanged || loading"
            type="primary"
            class="btn btn--md btn--primary"
            :loading="loading"
            @click="handleSubmit"
          >
            Update
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  ref,
  defineEmits,
  defineProps,
  computed,
} from 'vue';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import Message from '@/shared/message/message';
import { MemberService } from '@/modules/member/member-service';
import getAttributesModel from '@/shared/attributes/get-attributes-model';
import getParsedAttributes from '@/shared/attributes/get-parsed-attributes';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import AppMemberFormGlobalAttributes from './form/member-form-global-attributes.vue';
import AppMemberFormAttributes from './form/member-form-attributes.vue';

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

const memberStore = useMemberStore();
const { customAttributes } = storeToRefs(memberStore);

const loading = ref(false);
const isEditingAttributes = ref(false);

const computedAttributes = computed(() => Object.values(customAttributes.value));
const drawerModel = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});
const initialModel = computed(() => {
  const attributes = getAttributesModel(props.member);

  return {
    ...props.member,
    ...(Object.keys(attributes).length && attributes),
  };
});
const memberModel = ref(cloneDeep(initialModel.value));

const hasFormChanged = computed(() => !isEqual(
  cloneDeep(initialModel.value),
  memberModel.value,
));

const handleReset = () => {
  memberModel.value = cloneDeep(initialModel.value);
};

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  loading.value = true;

  const segments = props.member.segments.map((s) => s.id);
  const formattedAttributes = getParsedAttributes(
    computedAttributes.value,
    memberModel.value,
  );

  await MemberService.update(props.member.id, {
    attributes: formattedAttributes,
  }, segments);
  await store.dispatch('member/doFind', { id: props.member.id });
  Message.success('Member attributes updated successfully');
  emit('update:modelValue', false);
};

const onOpenManageAttributes = () => {
  isEditingAttributes.value = true;
};

const onCloseManageAttributes = () => {
  isEditingAttributes.value = false;
};
</script>

<script>
export default {
  name: 'AppMemberManageAttributesDrawer',
};
</script>

<style lang="scss">
.manage-attribute-drawer {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}

.edit-attribute-drawer {
  & .el-drawer__header {
    @apply p-6;
  }

  & .el-drawer__body {
    @apply p-0;
  }

  & .el-drawer__footer {
    @apply w-full p-6 border-t border-gray-200;
  }

  & .attribute-type {
    width: 100px;
  }

  & .el-form-item,
  .el-form .el-form-item__content {
    @apply mb-0;
  }
}
</style>
