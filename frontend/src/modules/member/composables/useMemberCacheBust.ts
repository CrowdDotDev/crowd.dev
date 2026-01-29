import { ref } from 'vue';

// Shared cache bust timestamp - when this changes, all member queries will be refetched with new data
const cacheBustTimestamp = ref(Date.now());

export function useMemberCacheBust() {
  const refreshCacheBust = () => {
    cacheBustTimestamp.value = Date.now();
  };

  return {
    cacheBustTimestamp,
    refreshCacheBust,
  };
}
