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
          @blur="$refs.tenantPlatforms.validate()"
        >
          <el-option
            v-for="integration in integrationsJsonArray"
            :key="integration.platform"
            :value="integration.platform"
            :label="integration.name"
            class="px-3 py-2 h-10 platform-item"
          >
            <div class="flex items-center h-6">
              <el-checkbox
                :model-value="
                  platformEnabled(integration.platform)
                "
                class="filter-checkbox flex h-3 transition-0"
              />
              <span class="text-black font-normal">{{
                integration.name
              }}</span>
            </div>
          </el-option>
        </el-select>
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
      </el-form-item>
    </el-form>
    <div
      class="-mx-8 -mb-8 px-8 py-6 bg-gray-50 flex justify-end"
    >
      <el-button
        class="btn btn--lg btn--primary"
        :loading="saveLoading"
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
import tenantCommunitySize from '@/jsons/tenant-community-size.json'

const { fields } = TenantModel
const formSchema = new FormSchema([
  fields.tenantName,
  fields.tenantPlatforms,
  fields.tenantSize
])
export default {
  name: 'AppOnboardCommunity',
  emits: ['saved'],
  data() {
    return {
      fields,
      integrationsJsonArray,
      tenantCommunitySize,
      rules: formSchema.rules(),
      model: {
        [fields.tenantPlatforms.name]: []
      },
      selectedPlatforms: []
    }
  },
  computed: {
    ...mapGetters('auth', ['currentTenant']),
    ...mapGetters('tenant', ['saveLoading']),

    frontendUrlHost() {
      return `.${config.frontendUrl.host}`
    },

    tenantSubdomain() {
      return tenantSubdomain
    }
  },
  watch: {
    currentTenant: {
      deep: true,
      immediate: true,
      handler(tenant) {
        if (tenant) {
          this.model = tenant
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
          if (this.currentTenant) {
            return this.doUpdate({
              id: this.currentTenant.id,
              values: this.model
            })
          }
          return this.doCreate(this.model)
        })
        .then(() => {
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
