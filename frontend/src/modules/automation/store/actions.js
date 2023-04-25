import { AutomationService } from '@/modules/automation/automation-service';

export default {
  getAutomations(type) {
    return AutomationService.list({
      type,
    }, null, 50, 0)
      .then(({ rows }) => {
        console.log('Rows', type);
        // this.automations = items;
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
};
