<template>
  <div>
    <div class="pt-6 pb-6">
      <lf-search v-model="search" class="h-9" :lazy="true" placeholder="Search users..." @update:model-value="searchUsers()" />
    </div>
    <div v-if="users.length > 0">
      <lf-table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user of users" :key="user.id">
            <td>
              <div class="flex items-center gap-3">
                <!--<lf-avatar :name="nameDisplay(user)" :size="32" />-->
                <p class="text-medium font-semibold">
                  {{ nameDisplay(user) }}
                </p>
              </div>
            </td>
            <td>
              <p class="text-medium">
                {{ user.email }}
              </p>
            </td>
            <td>
              <p class="text-medium">
                {{ roleDisplay(user.roles) }}
              </p>
            </td>
          </tr>
        </tbody>
      </lf-table>
      <div v-if="users.length < total" class="pt-4">
        <lf-button
          type="primary-ghost"
          loading-text="Loading users..."
          :loading="loading"
          @click="loadMore()"
        >
          Load more
        </lf-button>
      </div>
    </div>

    <div v-else-if="!loading">
      <app-empty-state-cta
        icon="user-group"
        title="No users found"
      />
    </div>
    <div v-if="loading" class="pt-8 flex justify-center">
      <lf-spinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import LfSearch from '@/ui-kit/search/Search.vue';
import { onMounted, ref } from 'vue';
import { UsersService } from '@/modules/admin/services/users.service';
import { UserModel } from '@/modules/admin/models/User.model';
import LfTable from '@/ui-kit/table/Table.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const search = ref('');
const loading = ref<boolean>(false);
const offset = ref(0);
const limit = ref(20);
const total = ref(0);

const users = ref<UserModel[]>([]);

const fetchUsers = () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  UsersService.list({
    filter: {
      query: search.value,
    },
    offset: offset.value,
    limit: limit.value,
    orderBy: 'fullName_ASC',
  })
    .then((res) => {
      if (offset.value > 0) {
        users.value = [...users.value, ...res.rows];
      } else {
        users.value = res.rows;
      }

      if (res.rows.length < limit.value) {
        total.value = users.value.length;
      } else {
        total.value = res.count;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const searchUsers = () => {
  offset.value = 0;
  fetchUsers();
};

const loadMore = () => {
  offset.value = users.value.length;
  fetchUsers();
};

const roleDisplay = (roles: string[]) => {
  const role = roles?.[0];

  if (role === 'admin') {
    return 'Admin';
  }
  if (role === 'projectAdmin') {
    return 'Project Admin';
  }

  if (role === 'readonly') {
    return 'Read-only';
  }
  return role;
};

const nameDisplay = (user: UserModel) => {
  if ((user.fullName || '').length > 0) {
    return user.fullName;
  }
  return user.email.split('@')[0];
};

onMounted(() => {
  searchUsers();
});
</script>

<script lang="ts">
export default {
  name: 'LfAdminUsers',
};
</script>
