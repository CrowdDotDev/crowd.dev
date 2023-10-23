<template>
  <nav class="p-1 flex flex-col">
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
      <router-link
        v-if="link.display({
          user: currentUser,
          tenant: currentTenant,
        })"
        :id="`menu-${link.id}`"
        :to="{ name: link.routeName }"
        :disabled="link.disable({
          user: currentUser,
          tenant: currentTenant,
        })"
        class="rounded-md h-8 transition !text-gray-400 flex items-center whitespace-nowrap flex-nowrap px-2.5 hover:bg-gray-50 mb-2"
        :class="{
          '!pl-1.5': props.collapsed,
        }"
        active-class="!bg-gray-100 font-medium !text-gray-900"
      >
        <i :class="link.icon" class="text-lg mr-4" />
        <span v-if="!props.collapsed" class="text-sm !text-gray-900">
          {{ link.label }}
        </span>
      </router-link>
    </el-tooltip>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { i18n } from '@/i18n';
import { MenuLink } from '@/modules/layout/types/MenuLink';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const props = defineProps<{
  collapsed: boolean,
  links: MenuLink[],
}>();

const { currentTenant, currentUser } = mapGetters('auth');

</script>

<script lang="ts">
export default {
  name: 'CrMenuLinks',
};
</script>
