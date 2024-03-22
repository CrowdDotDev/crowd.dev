<template>
  <div>
    <!-- Emails editing -->
    <div>
      <template v-for="(identity, ii) of identities" :key="ii">
        <app-member-form-emails-item
          v-if="identity.type === 'email'"
          v-model="identities[ii].value"
          class="pb-3"
        >
          <template #actions>
            <el-button
              class="btn btn--md btn--transparent w-10 h-10"
              @click="removeEmail(ii)"
            >
              <i class="ri-delete-bin-line text-lg" />
            </el-button>
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
  ref, watch,
} from 'vue';
import AppMemberFormEmailsItem from '@/modules/member/components/form/member-form-emails-item.vue';
import { MemberIdentity } from '@/modules/member/types/Member';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const identities = computed<MemberIdentity[]>({
  get() {
    return props.modelValue.identities;
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
  identities.value.push(defaultEmailIdentity);
};

const removeEmail = (index) => {
  identities.value.splice(index, 1);
};
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormEmails',
};
</script>
