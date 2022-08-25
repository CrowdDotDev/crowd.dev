<template>
  <div style="display: flex">
    <app-autocomplete-one-input
      :fetchFn="fetchFn"
      v-if="mode !== 'multiple'"
      v-model="model"
      :placeholder="placeholder"
    ></app-autocomplete-one-input>
    <app-autocomplete-many-input
      :fetchFn="fetchFn"
      v-if="mode === 'multiple'"
      v-model="model"
      :placeholder="placeholder"
    ></app-autocomplete-many-input>
    <el-button
      @click="doOpenModal()"
      icon="el-icon-plus"
      style="margin-left: 16px"
      class="btn btn--primary"
      v-if="hasPermissionToCreate && showCreate"
    ></el-button>
    <portal to="modal">
      <app-activity-form-modal
        :visible="dialogVisible"
        @close="onModalClose"
        @success="onModalSuccess"
        v-if="dialogVisible"
      ></app-activity-form-modal>
    </portal>
  </div>
</template>

<script>
import ActivityFormModal from '@/modules/activity/components/activity-form-modal.vue'
import { ActivityPermissions } from '@/modules/activity/activity-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'app-activity-autocomplete-input',
  props: [
    'value',
    'mode',
    'fetchFn',
    'mapperFn',
    'showCreate',
    'placeholder'
  ],

  components: {
    'app-activity-form-modal': ActivityFormModal
  },

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
        return this.value
      },

      set: function (value) {
        this.$emit('input', value)
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
