import { InsightsProjectModel } from '../models/insights-project.model';
import { InsightsProjectsState } from './state';

export default {
  setInsightsProjects(this: InsightsProjectsState, insightsProjects: InsightsProjectModel[]) {
    this.insightsProjects = insightsProjects;
  },
  getInsightsProject(this: InsightsProjectsState, id: string) {
    return this.insightsProjects.find((c) => c.id === id);
  },
  getInsightsProjects(this: InsightsProjectsState) {
    return this.insightsProjects;
  },
  searchInsightsProjects(this: InsightsProjectsState, query: string) {
    return this.insightsProjects.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  },
};
