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
          <h6 class="text-sm leading-4 !font-medium mb-1 text-black whitespace-nowrap">
            {{ props.tenant.name }}
          </h6>
          <div class="flex items-center flex-nowrap">
            <p v-if="props.tenant.plan" class="text-2xs text-gray-500 mr-1">
              {{ getPlan(props.tenant.plan) }}
            </p>
            <span
              v-if="isTrialExpired(props.tenant)"
              class="badge badge--xs badge--red hover:cursor-pointer"
            >{{ props.tenant.plan ? 'Trial expired' : 'Not subscribed' }}</span>
            <router-link
              v-else-if="getTrialDate(props.tenant)"
              :to="{ name: 'settings', query: { activeTab: 'plans' } }"
              class="flex items-center"
              @click.stop
            >
              <span
                class="badge badge--xs badge--light-yellow hover:cursor-pointer"
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
import { getTrialDate, isTrialExpired } from '@/utils/date';
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
