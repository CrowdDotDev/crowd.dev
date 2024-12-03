import { defineStore } from 'pinia';

export const useFooterStore = defineStore('footer-store', {
  state: () => ({
    visible: true,
  }),
  actions: {
    setVisibility(visible: boolean) {
      this.visible = visible;
    },
  },
});
