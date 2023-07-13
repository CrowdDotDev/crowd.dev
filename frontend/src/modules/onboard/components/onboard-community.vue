<template>
  <div>
    <el-form
      ref="form"
      :model="model"
      :rules="rules"
      class="form"
      label-position="left"
      label-width="0px"
      @submit.prevent="doSubmit"
    >
      <el-form-item
        :prop="fields.tenantName.name"
        class="mb-2"
      >
        <label
          for="tenantName"
          class="text-xs mb-1 font-semibold leading-5"
        >{{ fields.tenantName.label }}
          <span class="text-red-500">*</span></label>
        <el-input
          id="tenantName"
          ref="focus"
          v-model="model[fields.tenantName.name]"
          autocomplete="disabled"
          type="text"
        />
        <template #error="{ error }">
          <div class="flex items-center mt-1">
            <i
              class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
            />
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
            >{{ error }}</span>
          </div>
        </template>
      </el-form-item>

      <el-form-item
        id="tenantPlatformsItem"
        ref="tenantPlatforms"
        :prop="fields.tenantPlatforms.name"
        class="mb-2"
      >
        <label for="tenantPlatforms">
          <span
            class="block text-xs font-semibold leading-5"
          >
            {{ fields.tenantPlatforms.label }}
            <span class="text-red-500">*</span>
          </span>
          <span
            class="block text-2xs text-gray-500 mb-1 leading-4.5"
          >
            Where do people engage with your community?
          </span>
        </label>

        <el-select
          id="tenantPlatforms"
          v-model="model[fields.tenantPlatforms.name]"
          autocomplete="disabled"
          :multiple="true"
          :filterable="true"
          :reserve-keyword="false"
          placeholder="Select option(s)"
          class="extend"
          @blur="$refs.tenantPlatforms.validate()"
          @change="selectedPlatforms = $event"
        >
          <el-option
            v-for="integration in onboardPlatforms"
            :key="integration.value"
            :value="integration.value"
            :label="integration.label"
            class="px-3 py-2 h-10 platform-item"
            @mouseleave="onSelectMouseLeave"
          >
            <div class="flex items-center h-6">
              <el-checkbox
                :model-value="
                  platformEnabled(integration.value)
                "
                class="filter-checkbox flex h-3 transition-0"
              />
              <img
                :alt="integration.label"
                :src="integration.logo"
                class="w-4 h-4 mr-2"
              />
              <span class="text-black font-normal">{{
                integration.label
              }}</span>
            </div>
          </el-option>
        </el-select>
        <template #error="{ error }">
          <div class="flex items-center mt-1">
            <i
              class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
            />
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
            >{{ error }}</span>
          </div>
        </template>
      </el-form-item>
      <el-form-item
        :prop="fields.tenantSize.name"
        class="mb-0"
      >
        <label for="tenantSize">
          <span
            class="block text-xs font-semibold leading-5"
          >
            {{ fields.tenantSize.label }}
            <span class="text-red-500">*</span>
          </span>
          <span
            class="block text-2xs text-gray-500 mb-2 leading-4.5"
          >
            How many people gather on all those platforms
            combined?
          </span>
        </label>
        <el-radio-group
          id="tenantSize"
          v-model="model[fields.tenantSize.name]"
          class="radio-chips is-medium"
        >
          <el-radio-button
            v-for="size in tenantCommunitySize"
            :key="size.value"
            :label="size.value"
          >
            {{ size.label }}
          </el-radio-button>
        </el-radio-group>
        <template #error="{ error }">
          <div class="flex items-center mt-1">
            <i
              class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
            />
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
            >{{ error }}</span>
          </div>
        </template>
      </el-form-item>
      <el-form-item
        :prop="fields.reasonForUsingCrowd.name"
        class="mb-12"
      >
        <label for="reasonForUsingCrowd">
          <span
            class="block text-xs font-semibold leading-5 mb-1"
          >
            {{ fields.reasonForUsingCrowd.label }}
          </span>
        </label>
        <el-select
          id="reasonForUsingCrowd"
          v-model="model[fields.reasonForUsingCrowd.name]"
          placeholder="Select option"
        >
          <el-option
            v-for="(label, value) of achievements"
            :key="value"
            :value="value"
            :label="label"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <el-button
      id="submit"
      class="btn btn--lg btn--primary w-full"
      :loading="loading"
      :disabled="!isFormValid"
      @click="doSubmit()"
    >
      Get started
    </el-button>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { TenantModel } from '@/modules/tenant/tenant-model';
import { FormSchema } from '@/shared/form/form-schema';
import onboardPlatforms from '@/jsons/onboard-platforms.json';
import tenantCommunitySize from '@/jsons/tenant-community-size.json';
import { onSelectMouseLeave } from '@/utils/select';
import { TenantService } from '@/modules/tenant/tenant-service';
import Message from '@/shared/message/message';
import achievements from '@/modules/onboard/config/achievements.config';

const { fields } = TenantModel;
const formSchema = new FormSchema([
  fields.tenantName,
  fields.tenantPlatforms,
  fields.tenantSize,
  fields.reasonForUsingCrowd,
]);
export default {
  name: 'AppOnboardCommunity',
  props: {
    isNew: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['saved'],
  data() {
    return {
      fields,
      tenantCommunitySize,
      onboardPlatforms,
      achievements,
      rules: formSchema.rules(),
      model: {
        [fields.tenantPlatforms.name]: [],
      },
      selectedPlatforms: [],
      loading: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['currentTenant']),
    isFormValid() {
      return (
        formSchema.isValidSync(this.model)
        && this.model[fields.tenantPlatforms.name].length > 0
      );
    },
  },
  methods: {
    ...mapActions('tenant', ['doCreate', 'doUpdate']),
    ...mapActions('auth', ['doFinishOnboard']),

    platformEnabled(platform) {
      if (this.selectedPlatforms) {
        return this.selectedPlatforms.includes(platform);
      }
      return false;
    },

    doSubmit() {
      this.$refs.form
        .validate()
        .then(() => {
          this.loading = true;
          if (this.currentTenant && !this.isNew) {
            return this.doUpdate({
              id: this.currentTenant.id,
              values: this.model,
            });
          }
          return this.doCreate(this.model);
        })
        .then(() => TenantService.populateSampleData(
          this.currentTenant.id,
        ))
        .then(() => {
          const onboardType = localStorage.getItem('onboardType');
          let route = '/';
          if (onboardType === 'eagle-eye') {
            route = '/eagle-eye';
          }
          return this.doFinishOnboard({ route });
        })
        .then(() => {
          localStorage.removeItem('onboardType');
        })
        .catch(() => {
          Message.error(
            'There was an error creating community, please try again later',
          );
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onSelectMouseLeave,
  },
};
</script>

<style lang="scss">
.platform-item {
  &::after {
    display: none;
  }
}
</style>
