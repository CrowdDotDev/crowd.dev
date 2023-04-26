import { AutomationService } from '@/modules/automation/automation-service';

export default {
  getAutomations(type) {
    return AutomationService.list({
      type,
    }, null, this.pagination.perPage, 0)
      .then(({ rows, count }) => {
        console.log('Rows', type);
        this.automations = rows;
        this.pagination.count = count;
        return Promise.resolve(rows);
      });
  },
  getAutomationCount() {
    return AutomationService.list({}, null, 1, 0)
      .then(({ count }) => {
        this.totalAutomations = count;
        return Promise.resolve(count);
      });
  },
  createAutomation(data) {
    return AutomationService.create(data);
  },
};
