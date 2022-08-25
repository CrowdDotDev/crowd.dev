import initSearch from "../api/helpers/initSearch";

export default defineEventHandler(async (event) => {
  console.log("New request: " + event.req.url);

  const slugs = event.req.url.split("/").map((s) => {
    return s.includes("?") ? s.split("?")[0] : s;
  });
  const tenantSlugFromUrl = slugs[1];

  if (
    event.req.headers &&
    (event.req.headers.host === process.env.APP_DOMAIN ||
      event.req.headers.host === "deploy-preview-15--open-crowd.netlify.app") &&
    tenantSlugFromUrl
  ) {
    const searchClient = initSearch();
    const results = await searchClient
      .index(process.env.SETTINGS_INDEX)
      .search("", { filter: `tenantSlug=${tenantSlugFromUrl}` });

    if (
      results.hits.length > 0 &&
      results.hits[0].customUrl &&
      results.hits[0].customUrl !== ""
    ) {
      let redirectUrl = `https://${results.hits[0].customUrl}`;

      // if conversation slug exists, append to redirect url
      if (slugs.length > 2 && slugs[2]) {
        redirectUrl += `/${slugs[2]}`;
      }

      console.log("Redirecting to: ", redirectUrl);
      sendRedirect(event, redirectUrl, 301);
    }
  }
});
