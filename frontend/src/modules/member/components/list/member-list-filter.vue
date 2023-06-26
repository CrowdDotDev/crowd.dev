<template>
  <div class="member-filter">
    <app-filter-list
      module="member"
      placeholder="Search contributors..."
      :search-filter="memberSearch"
    >
      <template #dropdown>
        <app-filter-dropdown
          module="member"
          :attributes="memberAttributes"
          :custom-attributes="customAttributes"
        />
      </template>
    </app-filter-list>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';
import { MemberModel } from '@/modules/member/member-model';
import getCustomAttributes from '@/shared/fields/get-custom-attributes';

const store = useStore();

const memberAttributes = Object.values(
  MemberModel.fields,
).filter((f) => f.filterable);
const customAttributes = computed(() => getCustomAttributes({
  customAttributes: store.state.member.customAttributes,
  considerShowProperty: true,
}));

const memberSearch = computed(() => MemberModel.fields.search.forFilter());
</script>

<script>
export default {
  name: 'AppMemberListFilter',
};
</script>
