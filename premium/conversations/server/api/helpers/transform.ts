import fromNow from "./fromNow";

function replaceMark(text, log = false) {
  if (log) {
    console.log(text);
  }
  return text
    .replace(/<em>/g, '<span style="background-color: #f8e42c; color: black">')
    .replace(/<\/em>/g, "</span>")
    .replace(
      /<\/span> <span style="background-color: #f8e42c color: black">/g,
      " "
    );
}

function getActivitiesAndTitle(item, filterMatches = true) {
  item = filterMatches ? item._formatted : item;
  const activities = [];

  const highlightedActivities = item.activitiesBodies;
  for (let [index, activityBody] of highlightedActivities.entries()) {
    activityBody = activityBody || "";
    if (
      !filterMatches ||
      (activityBody.includes("<em>") && activityBody.includes("</em>"))
    ) {
      let attachments = [];
      if (
        item.activities[index].crowdInfo &&
        item.activities[index].crowdInfo.attachments
      ) {
        attachments = item.activities[index].crowdInfo.attachments.filter((a) =>
          a.mediaType ? a.mediaType.includes("image") : false
        );
        attachments = attachments.reduce(
          (acc, a) => {
            if (!acc.ids.includes(a.id)) {
              acc.ids.push(a.id);
              acc.attachments.push(a);
            }
            return acc;
          },
          {
            ids: [],
            attachments: [],
          }
        ).attachments;
      }
      activities.push({
        ...item.activities[index],
        attachments,
        body: replaceMark(activityBody),
      });
    }
  }

  return {
    activitiesHighlight: activities,
    title: replaceMark(item.title),
  };
}

function transform(items, filterMatches) {
  const out = [];
  for (const item of items) {
    out.push({
      ...getActivitiesAndTitle(item, filterMatches),
      activities: item.activities,
      slug: item.slug,
      platform: item.platform,
      id: item.id,
      url: item.url,
      views: item.views,
      lastActive:
        typeof item.lastActive === "number"
          ? fromNow(item.lastActive)
          : item.lastActive,
    });
  }

  return out;
}

export default transform;
