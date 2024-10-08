<template>
  <nav class="px-1 flex flex-col">
    <el-tooltip
      v-for="(link, li) of props.links"
      :key="`menu-link-${li}`"
      :disabled="!props.collapsed"
      :hide-after="50"
      :content="link.label"
      effect="dark"
      placement="right"
      raw-content
    >
      <template
        v-if="link.display({
          user: user,
          tenant: tenant,
        })"
      >
        <router-link
          v-if="link.routeName"
          :id="`menu-${link.id}`"
          :to="{ name: link.routeName, ...link.routeOptions }"
          class="rounded-md h-8 transition !text-gray-400 flex items-center whitespace-nowrap
          flex-nowrap px-1.5 hover:bg-gray-50 mb-2 overflow-hidden"
          :active-class="!disableActiveClass ? '!bg-gray-100 font-medium !text-gray-900' : ''"
          :class="props.linkClass"
        >
          <i v-if="link.icon" :class="[link.icon, props.iconClass]" class="text-lg mr-3" />
          <span class="!text-gray-900">
            {{ link.label }}
          </span>
        </router-link>
        <a
          v-else-if="link.href || link.click"
          :id="`menu-${link.id}`"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-md h-8 transition !text-gray-400 flex items-center justify-between
          group whitespace-nowrap flex-nowrap px-1.5 hover:bg-gray-50 mb-2 cursor-pointer overflow-hidden"
          :class="props.linkClass"
          @click="link.click && link.click()"
        >
          <div class="flex items-center">
            <i v-if="link.icon" :class="[link.icon, props.iconClass]" class="text-lg mr-3" />
            <span class="!text-gray-900">
              {{ link.label }}
            </span>
          </div>
          <i v-if="link.href" class="ri-external-link-line text-base text-gray-300 opacity-0 transition group-hover:opacity-100" />
        </a>
      </template>
    </el-tooltip>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { MenuLink } from '@/modules/layout/types/MenuLink';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  collapsed: boolean,
  links: MenuLink[],
  linkClass?: string,
  iconClass?: string,
  disableActiveClass?: boolean,
}>();

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

</script>

<script lang="ts">
export default {
  name: 'LfMenuLinks',
};
</script>
