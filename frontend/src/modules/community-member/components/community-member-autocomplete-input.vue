<template>
  <div style="display: flex">
    <app-autocomplete-one-input
      :fetchFn="fetchFn"
      v-if="mode !== 'multiple'"
      v-model="model"
      :placeholder="placeholder"
      :inputClass="inputClass"
      :inMemoryFilter="false"
    ></app-autocomplete-one-input>
    <app-autocomplete-many-input
      :fetchFn="fetchFn"
      v-if="mode === 'multiple'"
      v-model="model"
      :placeholder="placeholder"
      :inputClass="inputClass"
      :inMemoryFilter="false"
    ></app-autocomplete-many-input>
    <el-button
      @click="doOpenModal()"
      icon="el-icon-plus"
      style="margin-left: 16px"
      class="btn btn--secondary btn--secondary--orange"
      v-if="hasPermissionToCreate && showCreate"
    ></el-button>
    <portal to="modal">
      <app-community-member-form-modal
        :visible="dialogVisible"
        @close="onModalClose"
        @success="onModalSuccess"
        v-if="dialogVisible"
      ></app-community-member-form-modal>
    </portal>
  </div>
</template>

<script>
import CommunityMemberFormModal from '@/modules/community-member/components/community-member-form-modal.vue'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'app-community-member-autocomplete-input',
  props: [
    'value',
    'mode',
    'fetchFn',
    'mapperFn',
    'showCreate',
    'placeholder',
    'inputClass'
  ],

  components: {
    'app-community-member-form-modal': CommunityMemberFormModal
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
      return new CommunityMemberPermissions(
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
