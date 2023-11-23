export enum Status {
  Operational = 'operational',
  DegradedPerformance = 'degraded_performance',
  PartialOutage = 'partial_outage',
  MajorOutage = 'major_outage',
  UnderMaintenance = 'under_maintenance', // currently not in use
  Unknown = 'unknown',
}
