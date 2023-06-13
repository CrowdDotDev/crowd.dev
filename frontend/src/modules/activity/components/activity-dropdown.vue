<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      placement="bottom-end"
      trigger="click"
      @command="$event()"
      @visible-change="dropdownVisible = $event"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <app-activity-affiliations
          :show-affiliations="showAffiliations"
          :activity="activity"
          :organizations="organizations"
          @on-update="emit('onUpdate')"
        >
          <template #dropdownItems>
            <el-dropdown-item
              v-if="activity.platform === 'other'"
              :command="editActivity"
            >
              <i class="ri-pencil-line text-gray-400 mr-1" />
              <span>Edit Activity</span>
            </el-dropdown-item>
            <el-dropdown-item
              :command="doDestroyWithConfirm"
              :disabled="isDeleteLockedForSampleData"
            >
              <i
                class="ri-delete-bin-line mr-1"
                :class="{
                  'text-red-500': !isDeleteLockedForSampleData,
                }"
              />
              <span
                :class="{
                  'text-red-500': !isDeleteLockedForSampleData,
                }"
              >Delete activity</span>
            </el-dropdown-item>
          </template>
        </app-activity-affiliations>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ActivityPermissions } from '@/modules/activity/activity-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppActivityAffiliations from './activity-affiliations.vue';
import { ActivityService } from '../activity-service';

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
});

const dropdownVisible = ref(false);
const { currentTenant, currentUser } = mapGetters('auth');

const isReadOnly = computed(() => new ActivityPermissions(
  currentTenant.value,
  currentUser.value,
).edit === false);

const isDeleteLockedForSampleData = computed(() => new ActivityPermissions(
  currentTenant.value,
  currentUser.value,
).destroyLockedForSampleData);

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
    icon: 'ri-delete-bin-line',
  }).then(() => {
    ActivityService.destroyAll([props.activity.id], [props.activity.segmentId])
      .then(() => {
        emit('onUpdate');
      });
  });
};
</script>

<script>
export default {
  name: 'AppActivityDropdown',
};
</script>
