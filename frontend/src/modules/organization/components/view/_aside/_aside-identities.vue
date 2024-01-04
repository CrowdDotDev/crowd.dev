<template>
  <div class="px-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <div class="font-medium text-black">
          Identities
        </div>
        <el-tooltip placement="top">
          <template #content>
            Identities can be profiles on social platforms, emails,<br>
            or unique identifiers from internal sources.
          </template>
          <span>
            <i class="ri-information-line text-xs" />
          </span>
        </el-tooltip>
      </div>
    </div>
    <div class="-mx-6 mt-6">
      <app-identities-vertical-list
        :platform-handles-links="identities.getIdentities()"
        :x-padding="6"
        :display-show-more="true"
      />

      <div
        v-if="noIdentities"
        class="text-sm text-gray-600 px-6 pt-6"
      >
        <router-link
          :to="{
            name: 'organizationEdit',
            params: { id: organization.id },
          }"
        >
          Add identities
        </router-link>
      </div>
    </div>
  </div>

  <el-divider v-if="emails.length" class="!my-8 border-gray-200" />

  <div v-if="emails.length" class="flex flex-col px-6">
    <div class="font-medium text-black">
      Email(s)
    </div>

    <div v-if="emails.length" class="flex flex-col gap-2 mt-6">
      <div
        v-for="emailIdentity in emails"
        :key="emailIdentity.handle"
      >
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2"
          :class="{
            'hover:text-brand-500 cursor:pointer': emailIdentity.link,
          }"
          :href="emailIdentity.link"
        >{{ emailIdentity.handle }}</a>
      </div>

      <div
        v-if="Object.keys(identities.getEmails()).length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayEmailsMore = !displayEmailsMore"
      >
        Show {{ displayEmailsMore ? 'less' : 'more' }}
      </div>
    </div>
  </div>

  <el-divider v-if="phoneNumbers.length" class="!my-8" />

  <div v-if="phoneNumbers.length" class="flex flex-col px-6">
    <div class="font-medium text-black">
      Phone number(s)
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="phoneNumberIdentity in phoneNumbers"
        :key="phoneNumberIdentity.handle"
      >
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2"
          :class="{
            'hover:text-brand-500 cursor:pointer': phoneNumberIdentity.link,
          }"
          :href="phoneNumberIdentity.link"
        >{{ phoneNumberIdentity.handle }}</a>
      </div>

      <div
        v-if="Object.keys(identities.getPhoneNumbers()).length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayPhoneNumbersMore = !displayPhoneNumbersMore"
      >
        Show {{ displayPhoneNumbersMore ? 'less' : 'more' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, defineProps, ref,
} from 'vue';
import AppIdentitiesVerticalList from '@/shared/modules/identities/components/identities-vertical-list.vue';
import useOrganizationIdentities from '@/shared/modules/identities/config/useOrganizationIdentities';
import organizationOrder from '@/shared/modules/identities/config/identitiesOrder/organization';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const displayEmailsMore = ref(false);
const displayPhoneNumbersMore = ref(false);

const noIdentities = computed(() => (
  !props.organization.github?.url
    && !props.organization.linkedin?.url
    && !props.organization.twitter?.url
    && !props.organization.crunchbase?.url
    && !props.organization.facebook?.url
    && (!props.organization.emails
      || props.organization.emails.length === 0)
    && (!props.organization.phoneNumbers
      || props.organization.phoneNumbers.length === 0)
));

const identities = computed(() => useOrganizationIdentities({
  organization: props.organization,
  order: organizationOrder.profile,
}));

const emails = computed(() => {
  if (!displayEmailsMore.value) {
    return identities.value.getEmails().slice(0, 5);
  }

  return identities.value.getEmails();
});

const phoneNumbers = computed(() => {
  if (!displayPhoneNumbersMore.value) {
    return identities.value.getPhoneNumbers().slice(0, 5);
  }

  return identities.value.getPhoneNumbers();
});
</script>
