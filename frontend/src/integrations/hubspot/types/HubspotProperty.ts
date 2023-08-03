export interface HubspotProperty {
  label: string;
  name: string;
  type: string;
}

export interface HubspotProperties {
  members: HubspotProperty[];
  organizations: HubspotProperty[];
}
