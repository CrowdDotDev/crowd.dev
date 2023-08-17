<template>
  <app-drawer
    v-model="isDrawerOpen"
    title="Edit organizations"
    size="480px"
  >
    <template #content>
      <div class="border-t border-gray-200 p-6 -mx-6 -mt-5">
        <article v-for="(organization, oi) in organizations" :key="organization.id" class="flex items-center justify-between w-full pb-5">
          <div class="flex">
            <div class="h-6 w-6 border border-gray-200 rounded flex items-center justify-center mr-2.5">
              <app-avatar
                :entity="{
                  displayName: organization.displayName || organization.name,
                  avatar: organization.logo,
                }"
                size="xxxs"
              />
            </div>
            <div>
              <h6 class="text-xs leading-5 font-medium">
                {{ organization.displayName || organization.name }}
              </h6>
              <p class="text-2xs leading-5 text-gray-500">
                <span v-if="organization.memberOrganizations.title">{{ organization.memberOrganizations.title }}</span>
                <span v-if="organization.memberOrganizations.title" class="mx-1">•</span>
                <span>
                  {{ organization.memberOrganizations.dateStart
                    ? moment(organization.memberOrganizations.dateStart).utc().format('MMMM YYYY')
                    : 'Unkown' }}
                </span>
                <span class="mx-1 whitespace-nowrap">-></span>
                <span>
                  {{ organization.memberOrganizations.dateEnd
                    ? moment(organization.memberOrganizations.dateEnd).utc().format('MMMM YYYY')
                    : organization.memberOrganizations.dateStart ? 'Present' : 'Unkown' }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center">
            <div class="cursor-pointer h-8 w-8 mr-2 group" @click="edit(oi)">
              <span class="ri-pencil-line text-lg text-gray-400 group-hover:text-gray-500" />
            </div>
            <div class="cursor-pointer h-8 w-8 group" @click="remove(oi)">
              <span class="ri-delete-bin-line text-lg text-gray-400 group-hover:text-gray-500" />
            </div>
          </div>
        </article>
        <div class="flex justify-start pt-5">
          <el-button class="btn btn-link btn-link--primary" @click="isOrganizationFormModalOpen = true">
            + Add organization
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
  <app-member-form-organizations-create
    v-if="isOrganizationFormModalOpen"
    v-model="isOrganizationFormModalOpen"
    :organization="editOrganization !== null ? organizations[editOrganization] : null"
    @add="add($event)"
    @edit="update($event)"
    @update:model-value="!$event ? editOrganization = null : null"
  />
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref,
} from 'vue';
import AppDrawer from '@/shared/drawer/drawer.vue';
import { Member } from '@/modules/member/types/Member';
import AppAvatar from '@/shared/avatar/avatar.vue';
import moment from 'moment/moment';
import { Organization } from '@/modules/organization/types/Organization';
import AppMemberFormOrganizationsCreate from '@/modules/member/components/form/member-form-organizations-create.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): any}>();
const props = defineProps<{
  modelValue: boolean,
  member: Member,
}>();

const { doUpdate } = mapActions('member');

const organizations = ref<Organization[]>([]);

const isDrawerOpen = computed({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const isOrganizationFormModalOpen = ref<boolean>(false);
const editOrganization = ref<number | null>(null);

const save = () => {
  doUpdate({
    id: props.member.id,
    values: {
      organizations: organizations.value.map(
        (o) => ({
          id: o.id,
          name: o.name,
          ...o.memberOrganizations?.title && {
            title: o.memberOrganizations?.title,
          },
          ...o.memberOrganizations?.dateStart && {
            startDate: o.memberOrganizations?.dateStart,
          },
          ...o.memberOrganizations?.dateEnd && {
            endDate: o.memberOrganizations?.dateEnd,
          },
        }),
      ),
    },
  });
};

const edit = (organizationIndex: number) => {
  editOrganization.value = organizationIndex;
  isOrganizationFormModalOpen.value = true;
};

const update = (organization: Organization) => {
  organizations.value[editOrganization.value] = organization;
  editOrganization.value = null;
  save();
};

const add = (organization: Organization) => {
  organizations.value.push(organization);
  save();
};

const remove = (index: number) => {
  organizations.value.splice(index, 1);
  save();
};

onMounted(() => {
  organizations.value = props.member.organizations;
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberFormOrganizationsDrawer',
};
</script>
