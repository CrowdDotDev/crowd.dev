<template>
  <section v-bind="$attrs">
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Identities
      </h6>
      <lf-button
        type="secondary"
        size="small"
        :icon-only="true"
        @click="edit = true"
      >
        <lf-icon name="pencil-line" />
      </lf-button>
    </div>

    <div class="flex flex-col gap-4">
      <article
        v-for="identity of identityList.slice(0, showMore ? identityList.length : 10)"
        :key="`${identity.platform}-${identity.value}`"
        class="flex items-center"
      >
        <img
          v-if="platform(identity.platform)"
          :src="platform(identity.platform)?.image"
          class="h-5 w-5"
          :alt="identity.value"
        />
        <lf-icon
          v-else
          name="fingerprint-fill"
          :size="20"
          class="text-gray-600"
        />
        <div class="pl-3 flex items-center">
          <p v-if="!identity.url" class="text-medium max-w-48 truncate">
            {{ identity.value }}
          </p>
          <a
            v-else
            :href="identity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900 max-w-48 truncate"
          >
            {{ identity.value }}
          </a>
          <p v-if="!platform(identity.platform)" class="text-medium text-gray-400 ml-1">
            {{ identity.platform }}
          </p>
        </div>

        <lf-icon
          v-if="identity.verified"
          name="verified-badge-line"
          :size="16"
          class="ml-1 text-primary-500"
        />
      </article>
    </div>

    <lf-button
      v-if="identityList.length > 10"
      type="primary-link"
      size="medium"
      class="mt-6"
      @click="showMore = !showMore"
    >
      Show {{ showMore ? 'less' : 'more' }}
    </lf-button>
  </section>
  <app-member-manage-identities-drawer
    v-if="edit"
    v-model="edit"
    :member="props.contributor"
    @unmerge="unmerge"
    @update:model-value="emit('reload')"
  />
  <app-member-unmerge-dialog
    v-if="isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
  />
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import AppMemberManageIdentitiesDrawer from '@/modules/member/components/member-manage-identities-drawer.vue';
import { computed, ref } from 'vue';
import AppMemberUnmergeDialog from '@/modules/member/components/member-unmerge-dialog.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any}>();

const { identities } = useContributorHelpers();

const identityList = computed(() => identities(props.contributor));

const showMore = ref<boolean>(false);
const edit = ref<boolean>(false);
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref(null);
const platform = (name: string) => CrowdIntegrations.getConfig(name);

const unmerge = (identity: any) => {
  if (identity) {
    selectedIdentity.value = identity;
  }
  isUnmergeDialogOpen.value = props.contributor as any;
};
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentities',
};
</script>
