<template>
  <div>
    <el-dropdown
      v-if="hasPermission(LfPermission.activityEdit)"
      placement="bottom-end"
      trigger="click"
      @command="$event()"
      @visible-change="dropdownVisible = $event"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-400"
        type="button"
        @click.stop
      >
        <lf-icon name="ellipsis" type="solid" :size="16" />
      </button>
      <template #dropdown>
        <app-lf-activity-affiliations
          :show-affiliations="showAffiliations"
          :activity="activity"
          :organizations="organizations"
          @on-update="emit('onUpdate')"
        >
          <template #dropdownItems>
            <el-dropdown-item
              v-if="activity.platform === 'other' && !disableEdit"
              :command="editActivity"
            >
              <lf-icon name="pen fa-sharp" :size="16" class="mr-1 text-gray-400" />
              <span>Edit Activity</span>
            </el-dropdown-item>
            <el-dropdown-item
              :command="doDestroyWithConfirm"
            >
              <lf-icon name="trash-can" :size="16" class="mr-1 text-red-500" />
              <span
                class="text-red-500"
              >Delete activity</span>
            </el-dropdown-item>
          </template>
        </app-lf-activity-affiliations>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppLfActivityAffiliations from '@/modules/lf/activity/components/lf-activity-affiliations.vue';
import Errors from '@/shared/error/errors';
import { ActivityService } from '@/modules/activity/activity-service';
import Message from '@/shared/message/message';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const emit = defineEmits(['onUpdate', 'edit']);
const props = defineProps({
  showAffiliations: {
    type: Boolean,
    default: false,
  },
  activity: {
    type: Object,
    default: () => {},
  },
  organizations: {
    type: Array,
    default: () => [],
  },
  disableEdit: {
    type: Boolean,
    default: false,
  },
});

const dropdownVisible = ref(false);

const { trackEvent } = useProductTracking();

const { hasPermission } = usePermissions();

const editActivity = () => {
  emit('edit');
};

const doDestroyWithConfirm = async () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete activity',
    message:
            "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'fa-trash-can fa-light',
  }).then(() => {
    ActivityService.destroyAll([props.activity.id], [props.activity.segmentId])
      .then(() => {
        trackEvent({
          key: FeatureEventKey.DELETE_ACTIVITY,
          type: EventType.FEATURE,
          properties: {
            activityType: props.activity.type,
            activityPlatform: props.activity.platform,
          },
        });

        Message.success(
          'Activity successfully deleted',
        );

        emit('onUpdate');
      }).catch((error) => {
        Errors.handle(error);
      });
  });
};
</script>
