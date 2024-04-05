<template>
  <div>
    <el-tooltip
      v-if="props.record.identities?.[identityDropdown]?.value && props.showUnmerge && staticIdentities.length > 1"
      content="Not possible to unmerge an unsaved identity"
      placement="top-end"
      :disabled="!props.record.identities?.[identityDropdown]?.value || props.record.identities?.[identityDropdown]
        && props.modelValue.identities?.[identityDropdown]?.value === props.record.identities?.[identityDropdown]?.value"
    >
      <div class=" w-full">
        <button
          type="button"
          class="el-dropdown-menu__item w-full"
          :disabled="!props.record.identities?.[identityDropdown]
            || props.modelValue.identities?.[identityDropdown]?.value !== props.record.identities?.[identityDropdown]?.value"
          @click="emit('unmerge', {
            platform: props.modelValue.identities?.[identityDropdown]?.platform,
            username: props.record.identities?.[identityDropdown].value,
          }); identityDropdown = null"
        >
          <div class="flex items-center">
            <i class="ri-link-unlink-m text-gray-600 mr-3 text-base" />
            <span>Unmerge identity</span>
          </div>
        </button>
      </div>
    </el-tooltip>
    <!--    <template v-if="props.modelValue.identities?.[identityDropdown].value">-->
    <!--      <button-->
    <!--        v-if="!props.modelValue.identities?.[identityDropdown].verified"-->
    <!--        type="button"-->
    <!--        class="el-dropdown-menu__item w-full"-->
    <!--        :disabled="editingDisabled(props.modelValue.identities?.[identityDropdown].platform)"-->
    <!--        @click="verifyIdentity(identityDropdown); identityDropdown = null"-->
    <!--      >-->
    <!--        <i class="ri-verified-badge-line text-gray-600 mr-3 text-base" />-->
    <!--        <span>Verify identity</span>-->
    <!--      </button>-->
    <!--      <el-tooltip-->
    <!--        v-else-->
    <!--        content="Identities tracked from Integrations can’t be unverified"-->
    <!--        placement="top-end"-->
    <!--        :disabled="!props.modelValue.identities?.[identityDropdown].sourceId"-->
    <!--      >-->
    <!--        <div class="w-full">-->
    <!--          <button-->
    <!--            type="button"-->
    <!--            class="el-dropdown-menu__item w-full"-->
    <!--            :disabled="editingDisabled(props.modelValue.identities?.[identityDropdown].platform)-->
    <!--              && props.modelValue.identities?.[identityDropdown]?.sourceId"-->
    <!--            @click="unverifyIdentity(identityDropdown); identityDropdown = null"-->
    <!--          >-->
    <!--            <div class="flex items-center">-->
    <!--              <app-svg name="unverify" class="text-gray-600 mr-3 !h-4 !w-4 min-w-[1rem]" />-->
    <!--              <span>Unverify identity</span>-->
    <!--            </div>-->
    <!--          </button>-->
    <!--        </div>-->
    <!--      </el-tooltip>-->
    <!--      <el-divider />-->
    <!--    </template>-->

    <button
      type="button"
      class="el-dropdown-menu__item w-full"
      @click="emit('remove')"
    >
      <div
        class="flex items-center"
      >
        <i class="ri-delete-bin-6-line !text-red-600 mr-3 text-base" />
        <span class="text-red-600">Delete identity</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { MemberIdentity } from '@/modules/member/types/Member';

const emit = defineEmits<{(e: 'update', value: MemberIdentity): void, (e: 'remove'): void,}>();

const props = defineProps<{
  identity: MemberIdentity,
}>();

// const model = ref({ ...props.identity });
//
// const platform = computed(() => CrowdIntegrations.getConfig(props.identity.platform));
//
// const prefixes: Record<string, string> = {
//   devto: 'dev.to/',
//   discord: 'discord.com/',
//   github: 'github.com/',
//   slack: 'slack.com/',
//   twitter: 'twitter.com/',
//   linkedin: 'linkedin.com/in/',
//   reddit: 'reddit.com/user/',
//   hackernews: 'news.ycombinator.com/user?id=',
//   stackoverflow: 'stackoverflow.com/users/',
// };
//
// const editingDisabled = computed(() => {
//   if (['git'].includes(props.identity.platform)) {
//     return false;
//   }
//   return props.member
//     ? props.member.activeOn?.includes(props.identity.platform)
//     : false;
// });

// const platforms = computed(() => {
//   const usedPlatforms = model.value.identities.map((i) => i.platform);
//   return Object.keys(prefixes).filter((p) => usedPlatforms.includes(p));
// });
//
// const getPlatformIdentities = (platform) => props.modelValue.identities.filter((i) => i.platform === platform);
//
// const findPlatform = (platform) => CrowdIntegrations.getConfig(platform);
//
//
// const staticIdentities = computed(() => props.record.identities.filter((i) => i.type === 'username'));
//
// const removeIdentity = (index) => {
//   model.value.identities.splice(index, 1);
// };
//
// const verifyIdentity = (index) => {
//   const identity = { ...model.value.identities[index], verified: true };
//   model.value.identities.splice(index, 1, identity);
// };
//
// const unverifyIdentity = (index) => {
//   const identity = { ...model.value.identities[index], verified: false };
//   model.value.identities.splice(index, 1, identity);
// };
//
// const actionBtnRefs = ref({});
// const identityDropdown = ref(null);
// const setActionBtnsRef = (el, index) => {
//   if (el) {
//     actionBtnRefs.value[index] = el;
//   }
// };
//
// const onActionBtnClick = (index) => {
//   if (identityDropdown.value === index) {
//     identityDropdown.value = null;
//   } else {
//     identityDropdown.value = index;
//   }
// };
//
// const onClickOutside = (el) => {
//   if (!el.target?.id.includes('identityRef')) {
//     identityDropdown.value = null;
//   }
// };
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormIdentityDropdown',
};
</script>
