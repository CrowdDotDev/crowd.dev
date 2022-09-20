<template>
  <div style="display: flex">
    <app-autocomplete-one-input
      v-if="mode !== 'multiple'"
      v-model="model"
      :fetch-fn="fetchFn"
      :placeholder="placeholder"
    ></app-autocomplete-one-input>
    <app-autocomplete-many-input
      v-if="mode === 'multiple'"
      v-model="model"
      :fetch-fn="fetchFn"
      :placeholder="placeholder"
    ></app-autocomplete-many-input>
    <el-button
      v-if="hasPermissionToCreate && showCreate"
      style="margin-left: 16px"
      class="btn btn--primary"
      @click="doOpenModal()"
    ></el-button>
    <app-teleport to="#teleport-modal">
      <app-activity-form-modal
        v-if="dialogVisible"
        :visible="dialogVisible"
        @close="onModalClose"
        @success="onModalSuccess"
      ></app-activity-form-modal>
    </app-teleport>
  </div>
</template>

<script>
import ActivityFormModal from '@/modules/activity/components/activity-form-modal.vue'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'AppActivityAutocompleteInput',

  components: {
    'app-activity-form-modal': ActivityFormModal
  },
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    },
    mode: {
      type: String,
      default: 'single'
    },
    fetchFn: {
      type: Function,
      default: () => {}
    },
    mapperFn: {
      type: Function,
      default: () => {}
    },
    showCreate: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue'],

  data() {
    return {
      dialogVisible: false
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant'
    }),

    model: {
      get: function () {
        return this.modelValue
      },

      set: function (value) {
        this.$emit('update:modelValue', value)
      }
    },

    hasPermissionToCreate() {
      return new ActivityPermissions(
        this.currentTenant,
        this.currentUser
      ).create
    }
  },

  methods: {
    doOpenModal() {
      this.dialogVisible = true
    },

    onModalSuccess(record) {
      if (this.mode === 'multiple') {
        this.model = [...this.model, this.mapperFn(record)]
      } else {
        this.model = this.mapperFn(record)
      }

      this.onModalClose()
    },

    onModalClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style>
.el-form-item .el-form-item {
  margin-bottom: 22px;
}
</style>
