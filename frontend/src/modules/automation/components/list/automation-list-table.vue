<template>
  <div class="app-list-table not-clickable panel !pb-0">
    <div class="-mx-6 -mt-6">
      <el-table
        ref="table"
        :loading="false"
        :data="automations"
        row-key="id"
        border
        :default-sort="{ prop: 'updatedAt', order: 'descending' }"
      >
        <el-table-column label="Name" prop="name" sortable>
          <template #default="scope">
            <div class="flex items-center py-4">
              <div class="w-6">
                <img v-if="scope.row.type === 'webhook'" alt="Webhook" src="/images/automation/webhook.png" class="w-6">
                <img v-else-if="scope.row.type === 'slack'" alt="Slack" src="https://cdn-icons-png.flaticon.com/512/3800/3800024.png" class="w-6">
              </div>
              <div class="pl-4">
                <h6 class="text-sm font-medium mb-0.5 leading-5 text-black">
                  {{ scope.row.name ?? translate(
                    `entities.automation.triggers.${scope.row.trigger}`,
                  ) }}
                </h6>
                <p class="text-2xs leading-4.5 text-gray-500">
                  {{
                    translate(
                      `entities.automation.triggers.${scope.row.trigger}`,
                    )
                  }}
                </p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Created on" width="150" prop="createdAt" sortable>
          <template #default="scope">
            <div class="h-full flex items-center">
              <el-tooltip
                :content="formattedDate(scope.row.createdAt)"
                placement="top"
              >
                {{ timeAgo(scope.row.createdAt) }}
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Last updated" width="150" prop="updatedAt" sortable>
          <template #default="scope">
            <div class="h-full flex items-center">
              <el-tooltip
                :content="formattedDate(scope.row.updatedAt)"
                placement="top"
              >
                {{ timeAgo(scope.row.updatedAt) }}
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Last execution" width="165" prop="lastExecutionAt" sortable>
          <template #default="scope">
            <div class="h-full flex items-center">
              <el-tooltip
                :disabled="!scope.row.lastExecutionAt"
                :content="
                  formattedDate(scope.row.lastExecutionAt)
                "
                placement="top"
              >
                {{
                  scope.row.lastExecutionAt
                    ? timeAgo(scope.row.lastExecutionAt)
                    : '-'
                }}
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="130" prop="status" sortable>
          <template #default="scope">
            <div class="h-full flex items-center">
              <app-automation-toggle :automation="scope.row" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="" width="70">
          <template #default="scope">
            <div class="h-full flex items-center">
              <div class="table-actions">
                <app-automation-dropdown
                  :automation="scope.row"
                  @open-executions-drawer="
                    emit('openExecutionsDrawer', scope.row)
                  "
                  @open-edit-automation-drawer="
                    emit(
                      'openEditAutomationDrawer',
                      scope.row,
                    )
                  "
                />
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';
import { useAutomationStore } from '@/modules/automation/store';
import { storeToRefs } from 'pinia';
import { formatDateToTimeAgo } from '@/utils/date';
import moment from 'moment';
import { i18n } from '@/i18n';
import AppAutomationToggle from '@/modules/automation/components/automation-toggle.vue';
import AppAutomationDropdown from '@/modules/automation/components/automation-dropdown.vue';

const emit = defineEmits(['openEditAutomationDrawer', 'openExecutionsDrawer']);

const automationsStore = useAutomationStore();
const { automations } = storeToRefs(automationsStore);

const timeAgo = (date) => formatDateToTimeAgo(date);
const formattedDate = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');
const translate = (key) => i18n(key);

</script>

<script>
export default {
  name: 'AppAutomationListTable',
};
</script>
