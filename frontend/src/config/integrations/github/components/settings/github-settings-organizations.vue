<template>
  <div class="flex flex-col gap-5">
    <article v-for="org of orgs" :key="org.url" class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <lf-avatar :name="org.name" :src="org.image" :size="32" class="!rounded border border-gray-200">
          <template #placeholder>
            <div class="w-full h-full bg-gray-50 flex items-center justify-center">
              <lf-icon-old name="community-line" :size="12" class="text-gray-400" />
            </div>
          </template>
        </lf-avatar>
        <div>
          <p class="text-small font-semibold mb-0.5">
            {{ org.name }}
          </p>
          <div class="flex items-center gap-1">
            <lf-icon-old name="git-repository-line" class="text-gray-500" :size="16" />
            <p class="text-tiny text-gray-500">
              {{ org.repositories.length }} repositories
            </p>
          </div>
        </div>
      </div>
      <div>
        <lf-button type="secondary-ghost-light" @click="stopSyncing(org)">
          <lf-icon name="circle-minus" type="regular" />
          Stop syncing
        </lf-button>
      </div>
    </article>
  </div>
</template>

<script lang="ts" setup>
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { computed } from 'vue';

const props = defineProps<{
  organizations: any[];
}>();

const emit = defineEmits<{(e: 'update:organizations', value: any[]): void, (e: 'add'): void }>();

const orgs = computed<any[]>({
  get: () => props.organizations,
  set: (value) => emit('update:organizations', value),
});

const stopSyncing = (org: any) => {
  orgs.value = orgs.value.filter((o) => o.url !== org.url);
};
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsOrganizations',
};
</script>
