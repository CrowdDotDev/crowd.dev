<template>
  <div style="display: flex">
    <app-autocomplete-one-input
      v-if="mode !== 'multiple'"
      v-model="model"
      :fetch-fn="fetchFn"
      :placeholder="placeholder"
      :input-class="inputClass"
      :in-memory-filter="false"
    ></app-autocomplete-one-input>
    <app-autocomplete-many-input
      v-if="mode === 'multiple'"
      v-model="model"
      :fetch-fn="fetchFn"
      :placeholder="placeholder"
      :input-class="inputClass"
      :in-memory-filter="false"
    ></app-autocomplete-many-input>
    <el-button
      v-if="hasPermissionToCreate && showCreate"
      style="margin-left: 16px"
      class="btn btn--secondary btn--secondary--orange"
      @click="doOpenModal()"
    ></el-button>
    <app-teleport to="#teleport-modal">
      <app-community-member-form-modal
        v-if="dialogVisible"
        :visible="dialogVisible"
        @close="onModalClose"
        @success="onModalSuccess"
      ></app-community-member-form-modal>
    </app-teleport>
  </div>
</template>

<script>
import CommunityMemberFormModal from '@/modules/community-member/components/community-member-form-modal.vue'
import { CommunityMemberPermissions } from '@/modules/community-member/community-member-permissions'
import { mapGetters } from 'vuex'

export default {
  name: 'AppCommunityMemberAutocompleteInput',

  components: {
    'app-community-member-form-modal':
      CommunityMemberFormModal
  },
  props: {
    value: {
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
    },
    inputClass: {
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
        return this.value
      },

      set: function (value) {
        this.$emit('update:modelValue', value)
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
