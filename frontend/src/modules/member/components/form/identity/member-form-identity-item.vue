<template>
  <article class="flex items-center">
    <div class="mr-3">
      <img
        :src="platform.image"
        :alt="platform.name"
        class="w-5"
      />
    </div>
    <div class="flex-grow">
      <el-input
        v-model="model.value"
        placeholder="johndoe"
        :disabled="editingDisabled || platform === 'linkedin'
          && model.value.includes(
            'private-',
          )"
        :type="platform === 'linkedin'
          && model.value.includes(
            'private-',
          ) ? 'password' : 'text'"
        class="!h-8"
      >
        <template v-if="prefixes[model.platform]?.length" #prepend>
          <span class="font-medium text-gray-500">{{ prefixes[model.platform] }}</span>
        </template>
        <template #suffix>
          <div v-if="model.value === props.identity.value">
            <i
              v-if="model.value && model.verified"
              class="ri-verified-badge-fill text-brand-500 text-base leading-4"
            />
          </div>
          <div v-else class="flex gap-1 -mr-1">
            <cr-button size="tiny" :icon-only="true" @click="update()">
              <i class="ri-check-fill" />
            </cr-button>
            <cr-button size="tiny" type="secondary" :icon-only="true" @click="model.value = props.identity.value">
              <i class="ri-close-line" />
            </cr-button>
          </div>
        </template>
      </el-input>
    </div>
    <slot name="actions" />
  </article>
<!--  <div>-->
<!--    &lt;!&ndash; Identities editing &ndash;&gt;-->
<!--    <div>-->
<!--      <section-->
<!--        v-for="platform of platforms"-->
<!--        :key="platform"-->
<!--        class="border-b border-gray-200 last:border-none py-4"-->
<!--      >-->

<!--          <div class="flex-grow">-->
<!--            <template v-for="(identity, ii) of model.identities" :key="ii">-->
<!--              <template v-if="identity.platform === platform && identity.type === 'username'">-->
<!--                <article-->
<!--                  class="flex flex-grow items-center gap-2 pb-3 last:pb-0"-->
<!--                >-->

<!--                  <cr-button-->
<!--                    :id="`identityRef-${ii}`"-->
<!--                    :ref="(el) => setActionBtnsRef(el, ii)"-->
<!--                    type="tertiary-light-gray"-->
<!--                    size="small"-->
<!--                    :icon-only="true"-->
<!--                    class="relative"-->
<!--                    @click.prevent.stop="() => onActionBtnClick(ii)"-->
<!--                  >-->
<!--                    <i-->
<!--                      :id="`identityRefIcon-${ii}`"-->
<!--                      class="ri-more-fill"-->
<!--                    />-->
<!--                  </cr-button>-->
<!--                </article>-->
<!--              </template>-->
<!--            </template>-->
<!--          </div>-->
<!--        </div>-->
<!--      </section>-->
<!--    </div>-->
<!--  </div>-->
</template>

<script setup lang="ts">
import {
  computed, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { Member, MemberIdentity } from '@/modules/member/types/Member';
import CrButton from '@/ui-kit/button/Button.vue';

const emit = defineEmits<{(e: 'update', value: MemberIdentity): void}>();

const props = defineProps<{
  identity: MemberIdentity,
  member: Member,
}>();

const model = ref({ ...props.identity });

const platform = computed(() => CrowdIntegrations.getConfig(props.identity.platform));

const prefixes: Record<string, string> = {
  devto: 'dev.to/',
  discord: 'discord.com/',
  github: 'github.com/',
  slack: 'slack.com/',
  twitter: 'twitter.com/',
  linkedin: 'linkedin.com/in/',
  reddit: 'reddit.com/user/',
  hackernews: 'news.ycombinator.com/user?id=',
  stackoverflow: 'stackoverflow.com/users/',
};

const editingDisabled = computed(() => {
  if (['git'].includes(props.identity.platform)) {
    return false;
  }
  return props.member
    ? props.member.activeOn?.includes(props.identity.platform)
    : false;
});

const update = () => {
  emit('update', {
    ...props.identity,
    value: model.value.value,
  });
};

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
  name: 'AppMemberFormIdentityItem',
};
</script>
