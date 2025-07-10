// src/stores/toast.js
import { reactive } from 'vue';

export const notificationTypes = ['info', 'success', 'error'] as const;

export type NotificationTypes = (typeof notificationTypes)[number];
export interface ToastI {
  id: number;
  message: string;
  type: NotificationTypes;
  duration: number; // in milliseconds
}

let toastIdCounter = 0;

export const ToastStore = reactive({
  toasts: [] as ToastI[],
  maxVisible: 3,

  success(message: string, duration: number = 6000) {
    this.add(message, 'success', duration);
  },

  error(message: string, duration: number = 6000) {
    this.add(message, 'error', duration);
  },

  info(message: string, duration: number = 6000) {
    this.add(message, 'info', duration);
  },

  add(
    message: string,
    type: NotificationTypes = 'success',
    duration: number = 6000,
  ) {
    toastIdCounter += 1; // Increment the counter for unique IDs
    const toast = {
      id: toastIdCounter,
      message,
      type,
      duration,
    };
    this.toasts.push(toast);

    if (this.toasts.length > this.maxVisible) {
      this.toasts.shift(); // remove the oldest
    }

    setTimeout(() => {
      console.log('Removing toast with id:', toast);
      this.remove(toast.id);
    }, toast.duration);
  },

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  },
});
