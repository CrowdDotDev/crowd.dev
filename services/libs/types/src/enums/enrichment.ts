export enum MemberEnrichmentSource {
  PROGAI = 'progai',
  CLEARBIT = 'clearbit',
  SERP = 'serp',
  PROGAI_LINKEDIN_SCRAPER = 'progai-linkedin-scraper',
  CRUSTDATA = 'crustdata',
}

export enum MemberEnrichmentMaterializedView {
  MEMBERS_GLOBAL_ACTIVITY_COUNT = 'membersGlobalActivityCount',
  TOTAL_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringTotal',
  PROGAI_GITHUB_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringProgaiGithub',
  CLEARBIT_EMAIL_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringClearbit',
  SERP_LINKEDIN_FINDER_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringSerp',
  PROGAI_LINKEDIN_SCRAPER_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringProgaiLinkedin',
  CRUSTDATA_LINKEDIN_SCRAPER_ENRICHMENT_ANALYSIS = 'memberEnrichmentMonitoringCrustdata',
}
