<template>
  <section v-if="props.tenant" class="transition flex items-center cursor-pointer">
    <div class="flex items-center justify-between overflow-hidden w-full">
      <div class="flex items-center">
        <div>
          <app-squared-avatar
            :name="props.tenant.name"
          />
        </div>
        <div class="pl-3">
          <h6 class="text-sm leading-4 !font-medium mb-1 text-black">
            {{ props.tenant.name }}
          </h6>
          <div class="flex items-center">
            <p class="text-2xs text-gray-500">
              {{ getPlan(props.tenant.plan) }}
            </p>
            <router-link
              :to="{ name: 'settings', query: { activeTab: 'plans' } }"
              class="flex items-center"
              @click.stop
            >
              <span
                v-if="getTrialDate(props.tenant)"
                class="badge badge--xs badge--light-yellow ml-1 hover:cursor-pointer"
              >{{
                getTrialDate(props.tenant)
              }}</span>
            </router-link>
          </div>
        </div>
      </div>
      <div>
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import config from '@/config';
import { getTrialDate } from '@/utils/date';
import { TenantModel } from '@/modules/tenant/types/TenantModel';

const props = defineProps<{
  tenant: TenantModel,
}>();

const getPlan = (plan: string) => {
  if ((config as any).isCommunityVersion) {
    return 'Community';
  }
  return plan;
};
</script>

<script lang="ts">
export default {
  name: 'CrMenuWorkspaceCard',
};
</script>
