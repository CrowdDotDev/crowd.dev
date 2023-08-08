export interface HubspotList {
  id: string;
  name: string;
}

export interface HubspotLists {
  members: HubspotList[];
  organizations: HubspotList[];
}
