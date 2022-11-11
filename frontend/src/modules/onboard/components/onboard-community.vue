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
          <span class="text-brand-500">*</span></label
        >
        <el-input
          id="tenantName"
          ref="focus"
          v-model="model[fields.tenantName.name]"
          autocomplete="disabled"
          type="text"
        ></el-input>
        <template #error="{ error }">
          <div class="flex items-center mt-1">
            <i
              class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
            ></i>
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span
            >
          </div>
        </template>
      </el-form-item>

      <el-form-item
        ref="tenantPlatforms"
        :prop="fields.tenantPlatforms.name"
        class="mb-2"
      >
        <label for="tenantPlatforms">
          <span
            class="block text-xs font-semibold leading-5"
          >
            {{ fields.tenantPlatforms.label }}
            <span class="text-brand-500">*</span>
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
          >
            <div class="flex items-center h-6">
              <el-checkbox
                :model-value="
                  platformEnabled(integration.value)
                "
                class="filter-checkbox flex h-3 transition-0"
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
            ></i>
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span
            >
          </div>
        </template>
      </el-form-item>
      <el-form-item
        :prop="fields.tenantSize.name"
        class="mb-3"
      >
        <label>
          <span
            class="block text-xs font-semibold leading-5"
          >
            {{ fields.tenantSize.label }}
            <span class="text-brand-500">*</span>
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
          class="radio-chips"
          size="large"
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
            ></i>
            <span
              class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span
            >
          </div>
        </template>
      </el-form-item>
    </el-form>
    <div
      class="-mx-8 -mb-8 px-8 py-6 bg-gray-50 flex justify-end"
    >
      <el-button
        id="submit"
        class="btn btn--lg btn--primary"
        :loading="loading"
        :disabled="!isFormValid"
        @click="doSubmit()"
      >
        <span class="pr-3">Next step</span>
        <span class="ri-arrow-right-s-line text-xl"></span>
      </el-button>
    </div>
  </div>
</template>

<script>
import { TenantModel } from '@/modules/tenant/tenant-model'
import { FormSchema } from '@/shared/form/form-schema'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'
import { mapActions, mapGetters } from 'vuex'
import config from '@/config'
import integrationsJsonArray from '@/jsons/integrations.json'
import onboardPlatforms from '@/jsons/onboard-platforms.json'
import tenantCommunitySize from '@/jsons/tenant-community-size.json'

const { fields } = TenantModel
const formSchema = new FormSchema([
  fields.tenantName,
  fields.tenantPlatforms,
  fields.tenantSize
])
export default {
  name: 'AppOnboardCommunity',
  props: {
    isNew: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['saved'],
  data() {
    return {
      fields,
      integrationsJsonArray,
      tenantCommunitySize,
      onboardPlatforms,
      rules: formSchema.rules(),
      model: {
        [fields.tenantPlatforms.name]: []
      },
      selectedPlatforms: [],
      loading: false
    }
  },
  computed: {
    ...mapGetters('auth', ['currentTenant']),
    frontendUrlHost() {
      return `.${config.frontendUrl.host}`
    },

    tenantSubdomain() {
      return tenantSubdomain
    },

    isFormValid() {
      return (
        formSchema.isValidSync(this.model) &&
        this.model[fields.tenantPlatforms.name].length > 0
      )
    }
  },
  watch: {
    currentTenant: {
      deep: true,
      immediate: true,
      handler(tenant) {
        if (tenant && !this.isNew) {
          this.model = tenant
          this.selectedPlatforms =
            tenant[fields.tenantPlatforms.name] || []
        }
      }
    }
  },
  methods: {
    ...mapActions('tenant', ['doCreate', 'doUpdate']),

    platformEnabled(platform) {
      if (this.selectedPlatforms) {
        return this.selectedPlatforms.includes(platform)
      }
      return false
    },

    async doSubmit() {
      this.$refs.form
        .validate()
        .then(() => {
          this.loading = true
          if (this.currentTenant && !this.isNew) {
            return this.doUpdate({
              id: this.currentTenant.id,
              values: this.model
            })
          }
          return this.doCreate(this.model)
        })
        .then(() => {
          this.loading = false
          this.$emit('saved')
        })
    }
  }
}
</script>

<style lang="scss">
.platform-item {
  &::after {
    display: none;
  }
  &.selected {
    background: #fdedea !important;
  }
}
</style>
