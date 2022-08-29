<template>
  <div class="relative inline-flex">
    <el-button
      :disabled="bulkEditTagsDisabled"
      icon="ri-lg ri-price-tag-3-line"
      class="btn btn--secondary mr-2"
      @click="prepareBulkUpdateTags"
    >
      Edit Tags
    </el-button>

    <app-tag-popover
      v-model="bulkEditTagsModel"
      :visible="bulkEditTags"
      :loading="loading"
      @cancel="cancelBulkUpdateTags"
      @submit="doBulkUpdateTagsWithConfirm"
    />
  </div>
</template>

<script>
import AppTagPopover from '@/modules/tag/components/tag-popover'
import { i18n } from '@/i18n'
import { CommunityMemberModel } from '../community-member-model'
import { FormSchema } from '@/shared/form/form-schema'
import { mapActions } from 'vuex'

const { fields } = CommunityMemberModel
const formSchema = new FormSchema([fields.tags])

export default {
  name: 'AppCommunityMemberListBulkUpdateTags',

  components: {
    AppTagPopover
  },

  props: {
    loading: {
      type: Boolean,
      default: false
    },
    selectedRows: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      bulkEditTags: false,
      bulkEditTagsModel: [],
      bulkEditTagsInCommon: []
    }
  },

  computed: {
    bulkEditTagsDisabled() {
      return !this.selectedRows.length || this.loading
    }
  },

  methods: {
    ...mapActions({
      doBulkUpdateMembersTags:
        'communityMember/list/doBulkUpdateMembersTags'
    }),

    async doBulkUpdateTagsWithConfirm() {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        this.bulkEditTags = false

        return this.doBulkUpdateMembersTags({
          members: [...this.selectedRows],
          tagsInCommon: this.bulkEditTagsInCommon,
          tagsToSave: this.bulkEditTagsModel
        })
      } catch (error) {
        // no
      }
    },

    prepareBulkUpdateTags() {
      this.bulkEditTagsModel = this.selectedRows.reduce(
        (acc, item, index) => {
          let tags = formSchema.initialValues({
            tags: item.tags
          }).tags
          if (index > 0) {
            tags = tags.filter(
              (tag) =>
                acc.filter((t) => t.id === tag.id).length >
                0
            )
          }
          acc = tags
          return acc
        },
        []
      )
      this.bulkEditTagsInCommon = [
        ...this.bulkEditTagsModel
      ]
      this.bulkEditTags = true
    },

    cancelBulkUpdateTags() {
      this.bulkEditTagsModel = []
      this.bulkEditTagsInCommon = []
      this.bulkEditTags = false
    }
  }
}
</script>
