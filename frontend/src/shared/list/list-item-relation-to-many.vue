<template>
  <div v-if="!isBlank">
    <app-list-item-relation-to-one
      :key="item.id"
      :permission="permission"
      :url="url"
      :value="item"
      v-for="item of value"
    ></app-list-item-relation-to-one>
  </div>
</template>

<script>
export default {
  name: 'app-list-item-relation-to-many',

  props: ['value', 'url', 'permission'],

  computed: {
    isBlank() {
      return !this.value || !this.value.length
    }
  }
}
</script>

<style></style>
