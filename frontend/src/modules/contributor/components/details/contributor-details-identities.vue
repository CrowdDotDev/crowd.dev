<template>
  <section>
    <div class="flex justify-between items-center pb-6">
      <h6 class="text-h6">
        Identities
      </h6>
      <lf-button type="secondary" size="small" :icon-only="true">
        <lf-icon name="add-fill" />
      </lf-button>
    </div>

    <div class="flex flex-col gap-4">
      <article
        v-for="identity of identities(props.contributor)"
        :key="`${identity.platform}-${identity.value}`"
        class="flex items-center"
      >
        <img :src="platform(identity.platform)?.image" class="h-5 w-5" :alt="identity.value" />
        <div class="pl-3">
          <p v-if="!identity.url" class="text-medium">
            {{ identity.value }}
          </p>
          <a
            v-else
            :href="identity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-medium cursor-pointer !text-black underline decoration-dashed
             decoration-gray-400 underline-offset-4 hover:decoration-gray-900"
          >
            {{ identity.value }}
          </a>
        </div>

        <lf-icon
          v-if="identity.verified"
          name="verified-badge-line"
          :size="16"
          class="ml-1 text-primary-500"
        />
      </article>
    </div>
    <!--    <app-identities-vertical-list-members-->
    <!--        :member="props.contributor"-->
    <!--        :order="memberOrder.profile"-->
    <!--        :x-padding="6"-->
    <!--        :display-show-more="true"-->
    <!--    />-->
  </section>
</template>

<script setup lang="ts">
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';

const props = defineProps<{
  contributor: Contributor,
}>();

const { identities } = useContributorHelpers();

const platform = (name: string) => CrowdIntegrations.getConfig(name);
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsIdentities',
};
</script>
