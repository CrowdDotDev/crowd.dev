<template>
  <app-drawer
    v-model="isDrawerVisible"
    custom-class="integration-reddit-drawer"
    title="Discourse"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="isDrawerVisible = false"
  >
    <template #beforeTitle>
      <img
        :src="hubspotDetails.image"
        class="w-6 h-6 mr-2"
        alt="Discourse logo"
      />
    </template>
    <template #content>
      <div>
        <section class="pb-6">
          <h4 class="text-base font-semibold pb-1">
            Enable data syncing
          </h4>
          <p class="text-2xs text-gray-500">
            Define which crowd.dev core elements can be synced to or from HubSpot.
          </p>
        </section>
        <section class="pb-10 border-b border-gray-200">
          <article class="border border-gray-200 rounded-t py-4 px-5 flex justify-between">
            <div>
              <h5 class="text-sm font-semibold pb-1">
                Members
              </h5>
              <p class="text-2xs text-gray-500 leading-4.5">
                <span class="font-semibold">Data-in</span>: Existing members will automatically be enriched with data
                points
                from HubSpot contacts every 8 hours.
                <span class="font-semibold">Data-out</span>: To send members to HubSpot, use Automations or select
                members manually.
              </p>
            </div>
            <div>
              <el-switch v-model="form.members" />
            </div>
          </article>
          <article class="border border-gray-200 rounded-b border-t-0 py-4 px-5 flex justify-between">
            <div>
              <h5 class="text-sm font-semibold pb-1">
                Organizations
              </h5>
              <p class="text-2xs text-gray-500 leading-4.5">
                <span class="font-semibold">Data-in</span>: Existing organizations will automatically be enriched with
                data points from HubSpot companies every 8 hours.
                <span class="font-semibold">Data-out</span>: To send organizations to HubSpot, use Automations or select
                organizations manually.
              </p>
            </div>
            <div>
              <el-switch v-model="form.organizations" />
            </div>
          </article>
        </section>
        <section class="pt-6">
          <h4 class="text-base font-semibold pb-2">
            Attributes mapping
          </h4>
          <div class="flex justify-between pb-5">
            <p class="text-2xs text-gray-500">
              Select and map which attributes and properties to sync between crowd.dev and HubSpot.
            </p>
            <div class="pl-8">
              <el-button class="btn btn--bordered btn--sm !h-8" :disabled="!form.members && !form.organizations" @click="updateAttributes()">
                <span class="ri-refresh-line mr-2" />
                Update attributes
              </el-button>
            </div>
          </div>
          <div v-if="form.members || form.organizations" class="p-2 rounded bg-blue-50 flex items-center mb-3">
            <span class="ri-information-line text-blue-900 mr-2 text-base h-4 flex items-center" />
            <span class="text-[11px] text-blue-900 leading-4.5">We recommend creating custom properties in Hubspot for every crowd.dev attribute.
              <a href="#" target="_blank" class="underline text-blue-900 font-medium">Read more</a>
            </span>
          </div>
        </section>
        <section>
          <el-collapse v-model="activeView" accordion>
            <el-collapse-item name="member" :disabled="!form.members">
              <template #title>
                <div class="flex justify-between w-full items-center">
                  <div class="flex items-center">
                    <span
                      class="ri-arrow-down-s-line text-lg text-gray-500 mr-3 h-5 flex items-center transition-all transform"
                      :class="{ 'rotate-180': activeView === 'member' }"
                    />
                    <span class="text-xs font-medium">Member attributes</span>
                  </div>
                  <div v-if="form.members" class="h-5 px-2 rounded-full bg-gray-100 text-3xs text-gray-600 flex items-center">
                    0 attributes synced
                  </div>
                </div>
              </template>

              <section>
                <div>
                  Consistent with real life: in line with the process and logic of real
                  life, and comply with languages and habits that the users are used to;
                </div>
                <div>
                  Consistent within interface: all elements should be consistent, such
                  as: design style, icons and texts, position of elements, etc.
                </div>
              </section>
            </el-collapse-item>
            <el-collapse-item name="organization" :disabled="!form.organizations">
              <template #title>
                <div class="flex justify-between w-full items-center">
                  <div class="flex items-center">
                    <span
                      class="ri-arrow-down-s-line text-lg text-gray-500 mr-3 h-5 flex items-center transition-all transform"
                      :class="{ 'rotate-180': activeView === 'organization' }"
                    />
                    <span class="text-xs font-medium">Organization attributes</span>
                  </div>
                  <div v-if="form.organizations" class="h-5 px-2 rounded-full bg-gray-100 text-3xs text-gray-600 flex items-center">
                    0 attributes synced
                  </div>
                </div>
              </template>
              <div>
                Consistent with real life: in line with the process and logic of real
                life, and comply with languages and habits that the users are used to;
              </div>
              <div>
                Consistent within interface: all elements should be consistent, such
                as: design style, icons and texts, position of elements, etc.
              </div>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>
    </template>

    <template #footer>
      <!--      <div style="flex: auto">-->
      <!--        <el-button-->
      <!--          class="btn btn&#45;&#45;md btn&#45;&#45;bordered mr-3"-->
      <!--          :disabled="loading"-->
      <!--          @click="handleCancel"-->
      <!--        >-->
      <!--          Cancel-->
      <!--        </el-button>-->
      <!--        <el-button-->
      <!--          type="primary"-->
      <!--          class="btn btn&#45;&#45;md btn&#45;&#45;primary"-->
      <!--          :disabled="-->
      <!--            $v.$invalid-->
      <!--              || !hasFormChanged || loading"-->
      <!--          :loading="loading"-->
      <!--          @click="connect()"-->
      <!--        >-->
      <!--          {{ integration.settings?.forumHostname ? "Update" : "Connect" }}-->
      <!--        </el-button>-->
      <!--      </div>-->
    </template>
  </app-drawer>
</template>

<script lang="ts" setup>
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';

const props = defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const activeView = ref(null);

const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const form = reactive({
  members: false,
  organizations: false,
});

const hubspotDetails = computed(() => CrowdIntegrations.getConfig('hubspot'));

const updateAttributes = () => {

};

onMounted(() => {
  HubspotApiService.getMappableFields()
    .then((mappableData) => {
      console.log(mappableData);
    });
});

</script>

<script lang="ts">
export default {
  name: 'AppHubspotSettingsDrawer',
};
</script>

<style lang="scss">
.el-collapse {
  @apply border-0;
}

.el-collapse-item {
  .el-collapse-item__header {
    @apply h-14 border-0;
  }

  &:not(:last-child){
    @apply border-b border-gray-100;
  }

  .el-collapse-item__arrow {
    @apply hidden;
  }
}
</style>
