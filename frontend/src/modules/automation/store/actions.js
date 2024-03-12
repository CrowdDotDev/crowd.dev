import { AutomationService } from '@/modules/automation/automation-service';
import { store } from '@/store';
import { useAuthStore } from '@/modules/auth/store/auth.store';

const { getUser } = useAuthStore();

export default {
  getAutomations() {
    this.loadingAutomations = true;
    return AutomationService.list({
      type: this.filter.type !== 'all' ? this.filter.type : undefined,
    }, null, null, 0)
      .then(({ rows }) => {
        this.automations = rows;
        this.loadingAutomations = false;
        return Promise.resolve(rows);
      })
      .catch((err) => {
        this.loadingAutomations = false;
        return Promise.reject(err);
      });
  },
  changeAutomationFilter(filter) {
    this.filter = filter;
    this.getAutomations();
  },
  changePublishState(id, published) {
    AutomationService.update(id, {
      state: published ? 'active' : 'disabled',
    })
      .then((res) => {
        // Make sure that feature flags are updated for automationsCount
        getUser();

        this.getAutomations();
        return Promise.resolve(res);
      });
  },
  createAutomation(data) {
    return AutomationService.create(data)
      .then((res) => {
        // Make sure that feature flags are updated for automationsCount
        getUser();

        this.getAutomations();
        return Promise.resolve(res);
      });
  },
  updateAutomation(id, data) {
    return AutomationService.update(id, data)
      .then((res) => {
        this.getAutomations();
        return Promise.resolve(res);
      });
  },
  deleteAutomation(id) {
    return AutomationService.destroy(id)
      .then((res) => {
        // Make sure that feature flags are updated for automationsCount
        getUser();

        this.getAutomations();
        return Promise.resolve(res);
      });
  },
};
