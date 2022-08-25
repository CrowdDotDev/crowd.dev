import initSearch from "./helpers/initSearch";

export default async (req) => {
  const searchClient = initSearch();

  const results = await searchClient
    .index(process.env.SETTINGS_INDEX)
    .search("", {});
  return results.hits.filter((t) => t.tenantSlug !== "dev-founders");
};
