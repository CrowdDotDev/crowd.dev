<template>
  <el-divider class="!my-8 border-gray-200" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Email(s)
      </div>
      <el-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="btn btn-link btn-link--primary"
        @click="emit('editEmails')"
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
          :disabled="!showDomainTooltip[index]"
        >
          <div
            class="flex overflow-hidden"
            @mouseover="handleEmailsOnMouseOver(index)"
            @mouseleave="handleEmailsOnMouseLeave(index)"
          >
            <a
              ref="emailsRef"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2 truncate flex items-center gap-1"
              :class="{
                'hover:text-primary-500 cursor:pointer': emailIdentity.link,
              }"
              :href="emailIdentity.link ?? undefined"
            >
              <span>{{ emailIdentity.handle }}</span>
              <lf-verified-identity-badge v-if="emailIdentity.verified" />
            </a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.emails.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-primary-500 text-xs underline-offset-4 mt-5"
        @click="displayEmailsMore = !displayEmailsMore"
      >
        Show {{ displayEmailsMore ? 'less' : 'more' }}
      </div>

      <div v-if="emails.length === 0" class="text-xs italic text-gray-400">
        No email addresses
      </div>
    </div>
  </div>

  <el-divider class="!my-8" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Domain(s)
      </div>
      <el-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="btn btn-link btn-link--primary"
        @click="emit('editDomains')"
      >
        <i class="ri-pencil-line" /><span>Edit</span>
      </el-button>
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="(domainIdentity, index) in domains"
        :key="domainIdentity.handle"
      >
        <el-tooltip
          placement="top"
          :content="domainIdentity.handle"
          :disabled="!showDomainTooltip[index]"
        >
          <div
            class="flex overflow-hidden"
            @mouseover="handleDomainOnMouseOver(index)"
            @mouseleave="handleDomainOnMouseLeave(index)"
          >
            <a
              ref="domainRef"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2 truncate flex items-center gap-1"
              :class="{
                'hover:text-primary-500 cursor:pointer': domainIdentity.link,
              }"
              :href="domainIdentity.link ?? undefined"
            >
              <span>{{ domainIdentity.handle }}</span>
              <lf-verified-identity-badge v-if="domainIdentity.verified" />
            </a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.domains.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-primary-500 text-xs underline-offset-4 mt-5"
        @click="displayDomainsMore = !displayDomainsMore"
      >
        Show {{ displayDomainsMore ? 'less' : 'more' }}
      </div>

      <div v-if="domains.length === 0" class="text-xs italic text-gray-400">
        No domains
      </div>
    </div>
  </div>

  <el-divider class="!my-8" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Affiliated Profile(s)
      </div>
    </div>

    <div class="flex flex-col gap-2 mt-6">
      <div
        v-for="(affiliatedProfileIdentity, index) in affiliatedProfiles"
        :key="affiliatedProfileIdentity.handle"
      >
        <el-tooltip
          placement="top"
          :content="affiliatedProfileIdentity.handle"
          :disabled="!showDomainTooltip[index]"
        >
          <div
            class="flex overflow-hidden"
            @mouseover="handleAffiliatedProfilesOnMouseOver(index)"
            @mouseleave="handleAffiliatedProfilesOnMouseLeave(index)"
          >
            <a
              ref="affiliatedProfilesRef"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-900 border border-gray-200 rounded-md py-0.5 px-2 truncate flex items-center gap-1"
              :class="{
                'hover:text-primary-500 cursor:pointer': affiliatedProfileIdentity.link,
              }"
              :href="affiliatedProfileIdentity.link ?? undefined"
            >
              <span>{{ affiliatedProfileIdentity.handle }}</span>
              <lf-verified-identity-badge v-if="affiliatedProfileIdentity.verified" />
            </a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.affiliatedProfiles.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-primary-500 text-xs underline-offset-4 mt-5"
        @click="displayAffiliatedProfilesMore = !displayAffiliatedProfilesMore"
      >
        Show {{ displayAffiliatedProfilesMore ? 'less' : 'more' }}
      </div>

      <div v-if="affiliatedProfiles.length === 0" class="text-xs italic text-gray-400">
        No affiliated profiles
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
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="btn btn-link btn-link--primary"
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
                'hover:text-primary-500 cursor:pointer': phoneNumberIdentity.link,
              }"
              :href="phoneNumberIdentity.link ?? undefined"
            >{{ phoneNumberIdentity.handle }}</a>
          </div>
        </el-tooltip>
      </div>

      <div
        v-if="props.phoneNumbers.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-primary-500 text-xs underline-offset-4 mt-5"
        @click="displayPhoneNumbersMore = !displayPhoneNumbersMore"
      >
        Show {{ displayPhoneNumbersMore ? 'less' : 'more' }}
      </div>

      <div v-if="phoneNumbers.length === 0" class="text-xs text-gray-400 italic mt-6">
        No phone numbers
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import LfVerifiedIdentityBadge from '@/shared/modules/identities/components/verified-identity-badge.vue';

const props = defineProps<{
  emails: {
    handle: string;
    link: string | null;
    verified: boolean;
  }[],
  domains: {
    handle: string;
    link: string | null;
    verified: boolean;
  }[],
  affiliatedProfiles: {
    handle: string;
    link: string | null;
    verified: boolean;
  }[],
  phoneNumbers: {
    handle: string;
    link: string | null;
    verified: boolean;
  }[],
}>();

const emit = defineEmits<{(e: 'editDomains'): void, (e: 'editPhoneNumber'): void, (e: 'editEmails'): void }>();

const { hasPermission } = usePermissions();

const displayEmailsMore = ref(false);
const displayDomainsMore = ref(false);
const displayPhoneNumbersMore = ref(false);
const displayAffiliatedProfilesMore = ref(false);

const emailsRef = ref<Element[]>([]);
const domainRef = ref<Element[]>([]);
const phoneNumberRef = ref<Element[]>([]);
const affiliatedProfilesRef = ref<Element[]>([]);

const showEmailsTooltip = ref<boolean[]>([]);
const showDomainTooltip = ref<boolean[]>([]);
const showPhoneNumberTooltip = ref<boolean[]>([]);
const showAffiliatedProfilesTooltip = ref<boolean[]>([]);

const handleEmailsOnMouseOver = (index: number) => {
  if (!emailsRef.value[index]) {
    showEmailsTooltip.value[index] = false;
  }
  showEmailsTooltip.value[index] = emailsRef.value[index].scrollWidth > emailsRef.value[index].clientWidth;
};
const handleEmailsOnMouseLeave = (index: number) => {
  showEmailsTooltip.value[index] = false;
};

const handleAffiliatedProfilesOnMouseOver = (index: number) => {
  if (!affiliatedProfilesRef.value[index]) {
    showAffiliatedProfilesTooltip.value[index] = false;
  }
  showAffiliatedProfilesTooltip.value[index] = affiliatedProfilesRef.value[index].scrollWidth > affiliatedProfilesRef.value[index].clientWidth;
};
const handleAffiliatedProfilesOnMouseLeave = (index: number) => {
  showAffiliatedProfilesTooltip.value[index] = false;
};

const handleDomainOnMouseOver = (index: number) => {
  if (!domainRef.value[index]) {
    showDomainTooltip.value[index] = false;
  }
  showDomainTooltip.value[index] = domainRef.value[index].scrollWidth > domainRef.value[index].clientWidth;
};
const handleDomainOnMouseLeave = (index: number) => {
  showDomainTooltip.value[index] = false;
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

const affiliatedProfiles = computed(() => {
  if (!displayAffiliatedProfilesMore.value) {
    return props.affiliatedProfiles.slice(0, 5);
  }

  return props.affiliatedProfiles;
});

const emails = computed(() => {
  if (!displayEmailsMore.value) {
    return props.emails.slice(0, 5);
  }

  return props.emails;
});

const domains = computed(() => {
  if (!displayDomainsMore.value) {
    return props.domains.slice(0, 5);
  }

  return props.domains;
});

const phoneNumbers = computed(() => {
  if (!displayPhoneNumbersMore.value) {
    return props.phoneNumbers.slice(0, 5);
  }

  return props.phoneNumbers;
});
</script>
