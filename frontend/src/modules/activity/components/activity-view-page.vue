<template>
  <div>
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/' }">
        <span class="dashboard-label">Home</span>
      </el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/activities' }">
        <app-i18n code="entities.activity.menu"></app-i18n>
      </el-breadcrumb-item>
      <el-breadcrumb-item>
        <app-i18n
          code="entities.activity.view.title"
        ></app-i18n>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="panel">
      <h1 class="app-content-title">
        <app-i18n
          code="entities.activity.view.title"
        ></app-i18n>
      </h1>

      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      ></div>

      <app-activity-view-toolbar
        v-if="record"
      ></app-activity-view-toolbar>

      <el-form
        v-if="record"
        :label-position="labelPosition"
        :label-width="labelWidthForm"
        class="form"
        @submit.prevent
      >
        <app-view-item-text
          :label="fields.type.label"
          :value="presenter(record, 'type')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.timestamp.label"
          :value="presenter(record, 'timestamp')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.platform.label"
          :value="presenter(record, 'platform')"
        ></app-view-item-text>

        <app-view-item-text
          :label="fields.info.label"
          :value="presenter(record, 'info')"
        ></app-view-item-text>

        <app-view-item-relation-to-one
          :label="fields.communityMember.label"
          :permission="
            fields.communityMember.readPermission
          "
          :url="fields.communityMember.viewUrl"
          :value="presenter(record, 'communityMember')"
        ></app-view-item-relation-to-one>
      </el-form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ActivityViewToolbar from '@/modules/activity/components/activity-view-toolbar.vue'
import { ActivityModel } from '@/modules/activity/activity-model'

const { fields } = ActivityModel

export default {
  name: 'AppActivityViewPage',

  components: {
    'app-activity-view-toolbar': ActivityViewToolbar
  },

  props: {
    id: {
      type: String,
      default: null
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      record: 'activity/view/record',
      loading: 'activity/view/loading'
    }),

    fields() {
      return fields
    }
  },

  async created() {
    await this.doFind(this.id)
  },

  methods: {
    ...mapActions({
      doFind: 'activity/view/doFind'
    }),

    presenter(record, fieldName) {
      return ActivityModel.presenter(record, fieldName)
    }
  }
}
</script>
