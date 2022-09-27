<template>
  <el-container class="h-full sm:!hidden">
    <el-aside class="w-64">Menu</el-aside>
    <div
      class="gap-x-4 mx-6 grid md:grid-cols-6 lg:container lg:grid-cols-12"
    >
      <slot></slot>
    </div>
  </el-container>
  <el-container class="h-full md:!hidden lg:!hidden"
    >Resize</el-container
  >
</template>
