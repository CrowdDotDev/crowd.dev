import fromNow from "./fromNow";

function getAllActivities(item) {
  const activities = [];
  for (const [index, activity] of item.activities.entries()) {
    activities.push({
      body: item.activitiesBodies[index],
      attachments: activity.crowdInfo ? activity.crowdInfo.attachments : [],
      ...activity,
    });
  }
  return activities;
}

function getMarkedActivities(item) {
  const activities = [];
  const snippetActivities = item._snippetResult.activitiesBodies;
  for (const [index, snippet] of snippetActivities.entries()) {
    if (snippet.value.includes("mark")) {
      activities.push({
        ...item.activities[index],
        attachments: item.activities[index].crowdInfo
          ? item.activities[index].crowdInfo.attachments
          : [],

        body: snippet.value,
      });
    }
  }
  return activities;
}

function getActivities(item, markOnly) {
  return markOnly ? getMarkedActivities(item) : getAllActivities(item);
}

function transformData(items, markOnly = true) {
  const out = [];
  for (const item of items) {
    item.title = markOnly ? item._snippetResult.title.value : item.title;
    item.lastActive =
      typeof item.lastActive === "number"
        ? fromNow(item.lastActive)
        : item.lastActive;
    const activities = getActivities(item, markOnly);
    item.activitiesHighlight = activities;
    out.push(item);
  }
  return out;
}

export default transformData;
