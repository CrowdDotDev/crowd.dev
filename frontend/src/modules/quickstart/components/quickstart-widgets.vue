<template>
  <div>
    <template v-for="widget of quickstartWidgets" :key="widget.id">
      <div
        v-if="widget.display({
          user: currentUser,
          tenant: currentTenant,
        }) && widget.component"
        class="panel !p-0 mb-5"
      >
        <component :is="widget.component" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { quickstartWidgets } from '@/modules/quickstart/config/widgets';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const { currentUser, currentTenant } = mapGetters('auth');
</script>

<script lang="ts">
export default {
  name: 'CrQuickstartWidgets',
};
</script>

<style lang="scss">
</style>
