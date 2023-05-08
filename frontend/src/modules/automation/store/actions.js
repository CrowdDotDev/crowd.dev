import { AutomationService } from '@/modules/automation/automation-service';

export default {
  getAutomations() {
    this.loadingAutomations = true;
    return AutomationService.list({
      type: this.filter.type !== 'all' ? this.filter.type : undefined,
    }, null, 50, 0)
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
  createAutomation(data) {
    return AutomationService.create(data)
      .then((res) => {
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
        this.getAutomations();
        return Promise.resolve(res);
      });
  },
};
