<template>
  <div>
    <!-- Emails editing -->
    <div>
      <template v-for="(identity, ii) of model.identities" :key="ii">
        <app-member-form-emails-item
          v-if="identity.type === 'email'"
          v-model="model.identities[ii].value"
          :verified="identity.verified"
          class="pb-3"
        >
          <template #actions>
            <el-dropdown trigger="click" placement="bottom-end">
              <cr-button type="tertiary-light-gray" size="small" :icon-only="true">
                <i class="ri-more-fill" />
              </cr-button>
              <template #dropdown>
                <el-dropdown-item v-if="!identity.verified" @click="verifyEmail(ii)">
                  <i class="ri-verified-badge-line text-gray-600 mr-3 text-base" />
                  <span class="text-black">Verify email</span>
                </el-dropdown-item>
                <el-dropdown-item v-else @click="unverifyEmail(ii)">
                  <app-svg name="unverify" class="text-gray-600 mr-3 !h-4 !w-4 min-w-[1rem]" />
                  <span class="text-black">Unverify email</span>
                </el-dropdown-item>
                <el-divider />
                <el-dropdown-item @click="removeEmail(ii)">
                  <i class="ri-delete-bin-6-line !text-red-600 mr-3 text-base" />
                  <span class="text-red-600">Delete email</span>
                </el-dropdown-item>
              </template>
            </el-dropdown>
          </template>
        </app-member-form-emails-item>
      </template>

      <div class="flex">
        <div class="text-xs font-medium text-brand-500 cursor-pointer" @click="addEmail()">
          + Add email address
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
} from 'vue';
import AppMemberFormEmailsItem from '@/modules/member/components/form/member-form-emails-item.vue';
import { MemberIdentity } from '@/modules/member/types/Member';
import CrButton from '@/ui-kit/button/Button.vue';
import AppSvg from '@/shared/svg/svg.vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const addEmail = () => {
  const defaultEmailIdentity: MemberIdentity = {
    platform: 'custom',
    type: 'email',
    value: '',
    verified: true,
  };
  model.value.identities.push(defaultEmailIdentity);
};

const removeEmail = (index: number) => {
  model.value.identities.splice(index, 1);
};

const verifyEmail = (index: number) => {
  const identity = { ...model.value.identities[index], verified: true };
  model.value.identities.splice(index, 1, identity);
};

const unverifyEmail = (index: number) => {
  const identity = { ...model.value.identities[index], verified: false };
  model.value.identities.splice(index, 1, identity);
};
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormEmails',
};
</script>
