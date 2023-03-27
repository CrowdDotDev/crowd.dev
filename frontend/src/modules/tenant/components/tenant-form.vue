<template>
  <div>
    <el-form
      v-if="model"
      ref="form"
      label-position="top"
      :model="model"
      :rules="rules"
      class="form"
      @submit.prevent="doSubmit"
    >
      <div class="px-6 pb-4">
        <el-form-item
          :label="fields.tenantName.label"
          :prop="fields.tenantName.name"
          :required="fields.tenantName.required"
        >
          <el-input
            ref="focus"
            v-model="model[fields.tenantName.name]"
          />
        </el-form-item>
      </div>

      <el-footer
        class="el-dialog__footer flex justify-between"
      >
        <el-button
          :disabled="loading"
          class="btn btn-link btn-link--primary"
          @click="doReset"
        >
          <i class="ri-arrow-go-back-line" />
          <span>Reset changes</span>
        </el-button>

        <div class="flex gap-4">
          <el-button
            :disabled="loading"
            class="btn btn--md btn--bordered"
            @click="$emit('cancel')"
          >
            <app-i18n code="common.cancel" />
          </el-button>

          <el-button
            :loading="loading"
            class="btn btn--md btn--primary"
            @click="doSubmit"
          >
            Update
          </el-button>
        </div>
      </el-footer>
    </el-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { FormSchema } from '@/shared/form/form-schema';
import { TenantModel } from '@/modules/tenant/tenant-model';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';

const { fields } = TenantModel;
const formSchema = new FormSchema(
  [
    fields.tenantName,
    tenantSubdomain.isEnabled && fields.tenantUrl,
  ].filter(Boolean),
);

export default {
  name: 'AppTenantForm',

  props: {
    record: {
      type: Object,
      default: () => {},
    },
  },
  emits: ['cancel', 'success'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      loading: false,
    };
  },

  computed: {
    fields() {
      return fields;
    },
  },

  created() {
    this.model = formSchema.initialValues(this.record || {});
  },

  methods: {
    ...mapActions('tenant', ['doCreate', 'doUpdate']),
    doReset() {
      this.model = formSchema.initialValues(this.record);
    },

    doCancel() {
      this.$emit('cancel');
    },

    async doSubmit() {
      this.loading = true;
      try {
        await this.$refs.form.validate();
      } catch (error) {
        this.loading = false;
        return;
      }

      if (this.record.id) {
        await this.doUpdate({
          id: this.record.id,
          values: this.model,
        });
      } else {
        await this.doCreate(this.model);
      }

      this.$emit('success');
      this.loading = false;
    },
  },
};
</script>

<style></style>
