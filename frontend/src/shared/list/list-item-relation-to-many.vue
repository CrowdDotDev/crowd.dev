<template>
  <div v-if="!isBlank">
    <app-list-item-relation-to-one
      v-for="item of value"
      :key="item.id"
      :permission="permission"
      :url="url"
      :value="item"
    />
  </div>
</template>

<script>
export default {
  name: 'AppListItemRelationToMany',

  props: {
    label: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    permission: {
      type: String,
      default: null,
    },
  },

  computed: {
    isBlank() {
      return !this.value || !this.value.length;
    },
  },
};
</script>

<style></style>
