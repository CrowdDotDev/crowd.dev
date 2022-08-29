<template>
  <div v-if="!isBlank">
    <app-list-item-relation-to-one
      v-for="item of value"
      :key="item.id"
      :permission="permission"
      :url="url"
      :value="item"
    ></app-list-item-relation-to-one>
  </div>
</template>

<script>
export default {
  name: 'AppListItemRelationToMany',

  props: ['value', 'url', 'permission'],

  computed: {
    isBlank() {
      return !this.value || !this.value.length
    }
  }
}
</script>

<style></style>
