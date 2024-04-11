<template>
  <div class="flex items-center gap-1" :style="{color: style.color}">
    <div v-html="style.svg"></div>
    <p class="text-xs leading-5">{{percentage}}% confidence</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  similarity: number
}>();

const percentage = computed(() => Math.ceil(props.similarity * 100));

const style = computed<{
  color: string,
  svg: string
}>(() => {
  if (props.similarity >= 0.8) {
    return {
      color: '#059669',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#059669"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#059669"/>
</svg>`,
    };
  }
  if (props.similarity >= 0.6) {
    return {
      color: '#3B82F6',
      svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1666 2.66699H17.4999V17.5003H14.1666V2.66699ZM8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#D1D5DB"/>
<path d="M8.33325 7.5H11.6666V17.5003H8.33325V7.5Z" fill="#3B82F6"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#3B82F6"/>
</svg>`,
    };
  }
  return {
    color: '#D97706',
    svg: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.1667 2.66699H17.5V17.5003H14.1667V2.66699ZM8.33337 7.5H11.6667V17.5003H8.33337V7.5Z" fill="#D1D5DB"/>
<path d="M2.5 12H5.83333V17.5H2.5V12Z" fill="#F59E0B"/>
</svg>`,
  };
})
</script>

<script lang="ts">
export default {
  name: 'AppMemberMergeSimilarity',
};
</script>
