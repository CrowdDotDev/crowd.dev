<template>
  <div>
    <div class="flex items-center gap-1">
      <el-popover trigger="hover" placement="top" popper-class="!w-72">
        <template #reference>
          <div
            class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
          >
            <i
              class="ri-git-repository-line text-base !text-gray-600 mr-1 h-4 flex items-center"
            />
            {{ repositories.length }}
            {{ repositories.length !== 1 ? "remote URLs" : "remote URL" }}
          </div>
        </template>

        <p class="text-gray-400 text-[13px] font-semibold mb-4">
          Git Remote URLs
        </p>
        <div class="max-h-44 overflow-auto -my-1 px-1">
          <article
            v-for="repository of repositories"
            :key="repository"
            class="flex items-center flex-nowrap mb-4 last:mb-0"
          >
            <i
              class="ri-git-repository-line text-[16px] mr-1 h-4 flex items-center"
            />

            <a
              :href="repository"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-900 text-[13px] max-w-3xs truncate hover:underline"
            >
              {{ removeProtocolAndDomain(repository) }}
            </a>
          </article>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const repositories = computed<string[]>(
  () => props.integration.settings?.remotes,
);

const removeProtocolAndDomain = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    let path = parsedUrl.pathname;

    // Remove leading slash and trailing .git if present
    path = path.replace(/^\//, '').replace(/\.git$/, '');

    // For SSH URLs (git@github.com:user/repo.git)
    if (parsedUrl.protocol === 'ssh:') {
      const sshParts = url.split(':');
      path = sshParts[1].replace(/\.git$/, '');
    }

    return path;
  } catch (error) {
    // If URL parsing fails, return the original string
    return url.replace(/^(https?:\/\/|git@)/, '').replace(/\.git$/, '');
  }
};
</script>

<script lang="ts">
export default {
  name: 'AppGithubSettings',
};
</script>
