<template>
  <el-form-item :label="label" v-if="!isBlank">
    <el-col :lg="11" :md="16" :sm="24">
      <div :key="item.name" v-for="item in value">
        <strong>
          <a
            :href="item.downloadUrl"
            download
            target="_blank"
            >{{ item.name }}</a
          >
        </strong>
      </div>
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'app-view-item-file',

  props: ['label', 'value'],

  computed: {
    isBlank() {
      return !this.value || !this.value.length
    }
  }
}
</script>

<style></style>
