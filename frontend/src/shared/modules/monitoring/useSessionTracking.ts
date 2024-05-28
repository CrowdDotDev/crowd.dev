import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import config from '@/config';
import { createSession, updateSession } from './tracking-service';

const useSessionTracking = () => {
  const inactivityTimeout = ref<number | undefined>();

  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  const INACTIVITY_PERIOD = 30 * 60 * 1000;

  const shouldTrack: boolean = config.env !== 'staging';

  const endSession = () => {
    if (!shouldTrack) {
      return;
    }

    const userSession = sessionStorage.getItem('userSession');

    if (userSession) {
      updateSession(userSession, new Date().toISOString());
      sessionStorage.removeItem('userSession');
    }
  };

  const resetInactivityTimeout = () => {
    if (!shouldTrack) {
      return;
    }

    clearTimeout(inactivityTimeout.value);

    inactivityTimeout.value = setTimeout(endSession, INACTIVITY_PERIOD);
  };

  const startSession = async () => {
    if (!shouldTrack) {
      return Promise.resolve();
    }

    const userSession = sessionStorage.getItem('userSession');

    if (!userSession) {
      if (user.value) {
        return createSession({
          startTime: new Date().toISOString(),
          userId: user.value.id,
          userEmail: user.value.email,
        }).then((session) => {
          if (session.id) {
            sessionStorage.setItem('userSession', session.id);
          }

          return Promise.resolve();
        });
      }
    } else {
      resetInactivityTimeout();
    }

    return Promise.resolve();
  };

  const onStorageChange = (event: StorageEvent) => {
    if (!shouldTrack) {
      return;
    }

    if (event.key === 'userSession') {
      if (event.newValue === null) {
        endSession();
      } else {
        resetInactivityTimeout();
      }
    }
  };

  const attachListeners = () => {
    if (!shouldTrack) {
      return;
    }

    window.addEventListener('mousemove', resetInactivityTimeout);
    window.addEventListener('click', resetInactivityTimeout);
    window.addEventListener('keypress', resetInactivityTimeout);
    window.addEventListener('scroll', resetInactivityTimeout);
    window.addEventListener('beforeunload', endSession);
    window.addEventListener('storage', onStorageChange);
  };

  const detachListeners = () => {
    if (!shouldTrack) {
      return;
    }

    window.removeEventListener('mousemove', resetInactivityTimeout);
    window.removeEventListener('click', resetInactivityTimeout);
    window.removeEventListener('keypress', resetInactivityTimeout);
    window.removeEventListener('scroll', resetInactivityTimeout);
    window.removeEventListener('beforeunload', endSession);
    window.removeEventListener('storage', onStorageChange);
  };

  return {
    startSession,
    endSession,
    attachListeners,
    detachListeners,
    resetInactivityTimeout,
  };
};

export default useSessionTracking;
