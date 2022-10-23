<template>
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
      :prop="fields.tenantPlatforms.name"
      class="mb-2"
    >
      <label for="tenantPlatforms">
        <span class="block text-xs font-semibold leading-5">
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
        @change="selectedPlatforms = $event"
      >
        <el-option
          v-for="integration in integrationsJsonArray"
          :key="integration.platform"
          :value="integration.platform"
          :label="integration.name"
          class="px-3 py-2 h-10 platform-item"
          :class="{
            'bg-brand-50': platformEnabled(
              integration.platform
            )
          }"
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
      class="mb-2"
    >
      <label>
        <span class="block text-xs font-semibold leading-5">
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
</template>

<script>
import { TenantModel } from '@/modules/tenant/tenant-model'
import { FormSchema } from '@/shared/form/form-schema'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'
import { mapActions, mapGetters } from 'vuex'
import config from '@/config'
import { urlfy } from '@/shared/urlfy'
import integrationsJsonArray from '@/jsons/integrations.json'
import tenantCommunitySize from '@/jsons/tenant-community-size.json'

const { fields } = TenantModel
const formSchema = new FormSchema(
  [
    fields.tenantName,
    tenantSubdomain.isEnabled && fields.tenantUrl
  ].filter(Boolean)
)
export default {
  name: 'AppOnboardCommunity',
  data() {
    return {
      fields,
      integrationsJsonArray,
      tenantCommunitySize,
      rules: formSchema.rules(),
      model: {},
      selectedPlatforms: []
    }
  },
  computed: {
    ...mapGetters('auth', [
      'currentTenant',
      'invitedTenants'
    ]),
    ...mapGetters('tenant/form', ['saveLoading']),

    frontendUrlHost() {
      return `.${config.frontendUrl.host}`
    },

    tenantSubdomain() {
      return tenantSubdomain
    }
  },
  methods: {
    ...mapActions('tenant/form', ['doCreate']),

    onTenantNameChange() {
      this.model.url = urlfy(this.model.name)
    },

    platformEnabled(platform) {
      if (this.selectedPlatforms) {
        return this.selectedPlatforms.includes(platform)
      }
      return false
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      if (await this.doCreate(this.model)) {
        this.$emit('created')
      }
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
