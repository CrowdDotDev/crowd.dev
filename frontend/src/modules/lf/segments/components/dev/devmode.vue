<template>
  <div class="py-4">
    <section>
      <p class="text-xs text-black font-medium mb-1">
        Switch tenant
      </p>
      <el-select
        v-model="currentTenant"
        placeholder="Select tenant"
        class="w-80"
      >
        <el-option
          v-for="tenant of tenants"
          :key="tenant.id"
          :value="tenant.id"
          :label="tenant.name"
        >
          {{ tenant.name }}
        </el-option>
      </el-select>
    </section>
  </div>
</template>

<script lang="ts" setup>

import { useAuthStore } from '@/modules/auth/store/auth.store';
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { setTenant } = authStore;
const { user } = storeToRefs(authStore);

const tenants = computed(() => user.value.tenants.map((t) => ({ id: t.tenant.id, name: t.tenant.name })));

const currentTenant = ref(localStorage.getItem('currentTenant'));

watch(() => currentTenant.value, (tenantId) => {
  localStorage.setItem('currentTenant', tenantId);
  setTenant();
});
</script>

<script lang="ts">
export default {
  name: 'LfDevmode',
};
</script>
