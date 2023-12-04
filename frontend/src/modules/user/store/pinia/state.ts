export interface UserState {
  isDeveloperModeActive: Boolean,
}

const state: UserState = {
  isDeveloperModeActive: localStorage.getItem('developerMode') === 'true',
};

export default () => state;
