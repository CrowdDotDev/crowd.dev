create index if not exists idx_apidata_state_delayeduntil on integration."apiData" (state, "delayedUntil")
    where state = 'delayed';

create index if not exists idx_apidata_state on integration."apiData" (state);

create index if not exists idx_apidata_webhookid_updatedat on integration."apiData" ("webhookId", "updatedAt" desc);
