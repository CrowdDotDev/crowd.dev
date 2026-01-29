import { ref } from 'vue';

// Shared cache bust timestamp - when this changes, all member queries will be refetched with new data
const cacheBustTimestamp = ref(Date.now());

export function useMemberCacheBust() {
  const refreshCacheBust = () => {
    const newTimestamp = Date.now();
    console.log('🔄 [useMemberCacheBust] Updating cache bust timestamp:', {
      old: cacheBustTimestamp.value,
      new: newTimestamp,
    });
    cacheBustTimestamp.value = newTimestamp;
  };

  return {
    cacheBustTimestamp,
    refreshCacheBust,
  };
}
