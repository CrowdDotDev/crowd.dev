<template>
  <lf-modal v-model="isModalOpen" width="35rem">
    <div class="p-6">
      <div class="flex justify-between">
        <!-- icon -->
        <div class="bg-primary-50 h-10 w-10 flex justify-center items-center rounded-full">
          <lf-icon name="git-repository-private-line" :size="24" class="text-primary-500" />
        </div>

        <!-- close button -->
        <lf-button
          type="secondary-ghost-light"
          size="large"
          :icon-only="true"
          class="-mt-2 -mr-2"
          @click="isModalOpen = false"
        >
          <lf-icon name="close-line" :size="24" />
        </lf-button>
      </div>
      <section class="py-6">
        <h6 class="pb-3">
          Give access to GitHub organization repositories
        </h6>
        <p class="text-medium text-gray-600 pb-6">
          Connecting a GitHub organization and repositories requires admin access.<br>
          If you are an organization member, you need to request the installation of
          <span class="font-semibold">Community Management App</span> from an organization admin.
        </p>
        <lf-button class="w-full" @click="openGithubInstallation">
          I'm the GitHub organization admin
        </lf-button>
      </section>
      <div class="flex justify-center items-center h-6">
        <div class="border-b border-gray-200 flex-grow" />
        <div class="text-medium font-semibold text-gray-400 bg-white px-4">
          OR
        </div>
        <div class="border-b border-gray-200 flex-grow" />
      </div>
      <section class="py-6">
        <h6 class="pb-4">
          Connect one of the following GitHub organizations with Community Management access
        </h6>
        <div class="border border-gray-200 rounded-md">
          <article v-for="i in 3" :key="i" class="px-4 py-3 border-b border-gray-200 last:border-0 flex justify-between items-center">
            <div class="flex items-center">
              <lf-avatar :src="''" :name="'linuxfoundation'" :size="24" class="!rounded border border-gray-200 mr-1 mt-px">
                <template #placeholder>
                  <div class="w-full h-full bg-gray-50 flex items-center justify-center">
                    <lf-icon name="community-line" :size="16" class="text-gray-400" />
                  </div>
                </template>
              </lf-avatar>
              <p class="text-small pl-2">
                linuxfoundation
                {{ JSON.stringify(installations) }}
              </p>
              <p class="text-small pl-2 text-gray-400">
                {{ pluralize("repository", 6, true) }}
              </p>
            </div>
            <lf-button type="secondary" size="tiny">
              Connect organization
            </lf-button>
          </article>
        </div>
      </section>
      <section class="py-4 px-6">
        <p class="text-center text-small font-semibold pb-3">
          Your organization is not showing in the list?
        </p>
        <p class="text-tiny text-gray-500 text-center pb-4">
          Share the <span class="font-semibold">Community Management App</span> installation
          link with an admin member of your GitHub organization.
          Once the app is installed, you will be able to select the organization you want to connect.
        </p>
        <div class="flex justify-center">
          <lf-button type="primary-link" size="small">
            <lf-icon name="file-copy-line" />Copy app installation link to clipboard
          </lf-button>
        </div>
      </section>
    </div>
  </lf-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import LfModal from '@/ui-kit/modal/Modal.vue';
import config from '@/config';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import pluralize from 'pluralize';
import { IntegrationService } from '@/modules/integration/integration-service';

const props = defineProps<{
  modelValue: boolean,
  integration: any,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// We have 3 GitHub apps: test, test-local and prod
// Getting the proper URL from config file
const openGithubInstallation = () => window.open(config.gitHubInstallationUrl, '_self');

const installations = ref([]);

onMounted(async () => {
  try {
    installations.value = await IntegrationService.getGithubInstallations();
  } catch (error) {
    console.error('Failed to fetch GitHub installations:', error);
  }
});

const connectInstallation = async (installationId: string) => {
  try {
    await IntegrationService.githubConnectInstallation(installationId);
  } catch (error) {
    console.error('Failed to connect GitHub installation:', error);
  }
};

</script>

<script lang="ts">
export default {
  name: 'LfGithubConnectModal',
};
</script>
