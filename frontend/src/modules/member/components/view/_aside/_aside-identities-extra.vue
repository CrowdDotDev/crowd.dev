<template>
  <el-divider class="!my-8 border-gray-200" />

  <div class="flex flex-col px-6">
    <div class="flex items-center justify-between">
      <div class="font-medium text-black">
        Email(s)
      </div>
      <el-button
        class="btn btn-link btn-link--linux"
        :disabled="isEditLockedForSampleData"
        @click="emit('edit')"
      >
        <i class="ri-pencil-line text-lg" />
      </el-button>
    </div>

    <div v-if="emails.length" class="flex flex-col gap-2 mt-6">
      <div
        v-for="(emailIdentity, email) in distinctEmails"
        :key="email"
      >
        <div
          class="flex overflow-hidden"
        >
          <a
            ref="emailRef"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-gray-900 hover:text-brand-500 border border-gray-200 rounded-md py-0.5 px-2 truncate flex items-center"
            :href="emailIdentity.link"
          >
            {{ email }}

            <div v-if="emailIdentity.verified" class="pl-1">
              <el-tooltip placement="top" content="Verified email">
                <i class="ri-verified-badge-fill text-brand-500 text-base leading-4" />
              </el-tooltip>
            </div>

          </a>
          <div v-if="getPlatformLabel(emailIdentity.platforms)" class="ml-2 flex items-center">
            <el-tooltip placement="top">
              <template #content>
                <span class="font-semibold">Source:&nbsp;</span>{{ getPlatformLabel(emailIdentity.platforms) }}
              </template>
              <i class="ri-shining-fill text-sm" :class="isEnrichment(emailIdentity.platforms) ? 'text-purple-400' : 'text-gray-300'" />
            </el-tooltip>
          </div>
        </div>
      </div>
      <div
        v-if="props.emails.length > 5"
        class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4 mt-5"
        @click="displayMore = !displayMore"
      >
        Show {{ displayMore ? 'less' : 'more' }}
      </div>
      <div v-if="emails.length === 0" class="text-2xs italic text-gray-500">
        No email addresses
      </div>
    </div>

    <div v-else class="text-xs text-gray-400 italic mt-6">
      No email addresses
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const emit = defineEmits(['edit']);
const props = defineProps<{
  emails: {
    handle: string;
    link: string;
  }[],
}>();

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const displayMore = ref(false);
const emailRef = ref<Element[]>([]);

const emails = computed(() => {
  if (!displayMore.value) {
    return props.emails.slice(0, 5);
  }

  return props.emails;
});

const distinctEmails = computed(() => props.emails.reduce((obj: Record<string, any>, identity: any) => {
  const emailObject = { ...obj };
  if (!(identity.handle in emailObject)) {
    emailObject[identity.handle] = {
      ...identity,
      platforms: [],
    };
  }
  emailObject[identity.handle].platforms.push(identity.platform);
  emailObject[identity.handle].verified = emailObject[identity.handle].verified || identity.verified;

  return emailObject;
}, {}));

const isEnrichment = (platforms:string[]) => platforms.includes('enrichment');

const getPlatformLabel = (platforms: string[]) => platforms
  .filter((platform) => !['integration_or_enrichment'].includes(platform))
  .map((platform) => {
    if (platform === 'lfid') {
      return 'LFID';
    }
    if (platform === 'integration') {
      return 'Integration';
    }
    if (platform === 'enrichment') {
      return 'Enrichment';
    }
    return CrowdIntegrations.getConfig(platform)?.name || platform;
  }).join(', ');

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  tenant.value,
  user.value,
).editLockedForSampleData);
</script>
