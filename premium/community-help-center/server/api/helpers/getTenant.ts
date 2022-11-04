export default function (results) {
  return results.hits.length > 0
    ? {
        name: results.hits[0].tenant,
        inviteLink: results.hits[0].inviteLink,
        homepageLink: results.hits[0].homepageLink,
      }
    : false;
}
