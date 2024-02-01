<template>
  <el-divider class="!my-8 border-gray-200" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Email(s)
      </div>
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="emit('editEmail')"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="(emailIdentity, index) in emails"
        :key="emailIdentity.handle"
      >
        <el-tooltip
          placement="top"
          :content="emailIdentity.handle"
          :disabled="!showEmailTooltip[index]"
        >
          <div
            class="flex overflow-hidden"
            @mouseover="handleEmailOnMouseOver(index)"
            @mouseleave="handleEmailOnMouseLeave(index)"
          >
            <a
              ref="emailRef"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2 truncate"
              :class="{
                'hover:text-brand-500 cursor:pointer': emailIdentity.link,
              }"
              :href="emailIdentity.link"
            >{{ emailIdentity.handle }}</a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.emails.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayEmailsMore = !displayEmailsMore"
      >
        Show {{ displayEmailsMore ? 'less' : 'more' }}
      </div>

      <div v-if="emails.length === 0" class="text-2xs italic text-gray-500">
        No email addresses
      </div>
    </div>
  </div>

  <el-divider class="!my-8" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Phone number(s)
      </div>
      <el-button
        class="btn btn-link btn-link--primary"
        :disabled="isEditLockedForSampleData"
        @click="emit('editPhoneNumber')"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>
    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="(phoneNumberIdentity, index) in phoneNumbers"
        :key="phoneNumberIdentity.handle"
      >
        <el-tooltip
          placement="top"
          :content="phoneNumberIdentity.handle"
          :disabled="!showPhoneNumberTooltip[index]"
        >
          <div
            class="flex overflow-hidden"
            @mouseover="handlePhoneNumberOnMouseOver(index)"
            @mouseleave="handlePhoneNumberOnMouseLeave(index)"
          >
            <a
              ref="phoneNumberRef"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2 truncate"
              :class="{
                'hover:text-brand-500 cursor:pointer': phoneNumberIdentity.link,
              }"
              :href="phoneNumberIdentity.link"
            >{{ phoneNumberIdentity.handle }}</a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.phoneNumbers.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayPhoneNumbersMore = !displayPhoneNumbersMore"
      >
        Show {{ displayPhoneNumbersMore ? 'less' : 'more' }}
      </div>

      <div v-if="phoneNumbers.length === 0" class="text-2xs italic text-gray-500">
        No phone numbers
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { OrganizationPermissions } from '@/modules/organization/organization-permissions';

const props = defineProps<{
  emails: {
    handle: string;
    link: string;
  }[],
  phoneNumbers: {
    handle: string;
    link: string;
  }[],
}>();

const emit = defineEmits<{(e: 'editEmail'): void, (e: 'editPhoneNumber'): void, }>();

const { currentTenant, currentUser } = mapGetters('auth');

const isEditLockedForSampleData = computed(() => new OrganizationPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const displayEmailsMore = ref(false);
const displayPhoneNumbersMore = ref(false);

const emailRef = ref<Element[]>([]);
const phoneNumberRef = ref<Element[]>([]);

const showEmailTooltip = ref<boolean[]>([]);
const showPhoneNumberTooltip = ref<boolean[]>([]);

const handleEmailOnMouseOver = (index: number) => {
  if (!emailRef.value[index]) {
    showEmailTooltip.value[index] = false;
  }
  showEmailTooltip.value[index] = emailRef.value[index].scrollWidth > emailRef.value[index].clientWidth;
};
const handleEmailOnMouseLeave = (index: number) => {
  showEmailTooltip.value[index] = false;
};

const handlePhoneNumberOnMouseOver = (index: number) => {
  if (!phoneNumberRef.value[index]) {
    showPhoneNumberTooltip.value[index] = false;
  }
  showPhoneNumberTooltip.value[index] = phoneNumberRef.value[index].scrollWidth > phoneNumberRef.value[index].clientWidth;
};
const handlePhoneNumberOnMouseLeave = (index: number) => {
  showPhoneNumberTooltip.value[index] = false;
};

const emails = computed(() => {
  if (!displayEmailsMore.value) {
    return props.emails.slice(0, 5);
  }

  return props.emails;
});

const phoneNumbers = computed(() => {
  if (!displayPhoneNumbersMore.value) {
    return props.phoneNumbers.slice(0, 5);
  }

  return props.phoneNumbers;
});
</script>
