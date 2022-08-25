const {
  conversations,
  activityRange,
  tenant,
  platforms,
} = require("./specs.json");
const MeiliSearch = require("meilisearch").MeiliSearch;
const moment = require("moment");
const LoremIpsum = require("lorem-ipsum").LoremIpsum;
const Typesense = require("typesense");
require("dotenv").config();

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

function randomInt(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateActivity() {
  const options = ["words", "sentences", "paragraphs"];
  const option = options[Math.floor(Math.random() * options.length)];
  if (option === "words") {
    lorem.generateWords(randomInt(5, 30));
  } else if (option === "sentences") {
    lorem.generateSentences(randomInt(5, 10));
  }
  return lorem.generateParagraphs(randomInt(1, 3));
}

function generateTitle() {
  const options = ["words", "sentences"];
  const option = options[Math.floor(Math.random() * options.length)];
  if (option === "words") {
    return lorem.generateWords(randomInt(5, 30));
  }
  return lorem.generateSentences(randomInt(1, 3));
}

function getTimestamps(n) {
  const start = moment().unix();
  const end = moment().subtract(1, "years").unix();
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(randomInt(end, start));
  }
  return out.sort();
}

function makeAuthor() {
  const length = randomInt(2, 15);
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function makeDocuments(tenantSlug = "crowddev") {
  const platforKeys = Object.keys(platforms);
  const out = [];
  for (let conversationN = 0; conversationN < conversations; conversationN++) {
    const platform =
      platforKeys[Math.floor(Math.random() * platforKeys.length)];
    const nActivities = randomInt(activityRange[0], activityRange[1]);
    const timestamps = getTimestamps(nActivities);
    const conversationId = "conversation-" + conversationN;
    const title = generateTitle();
    const conversation = {
      title: title,
      id: `${conversationId}-${tenantSlug}`,
      platform,
      lastActive: undefined,
      channel:
        platforms[platform][
          Math.floor(Math.random() * platforms[platform].length)
        ],
      slug: title.toLowerCase().split(" ").slice(4).join("-"),
      activities: [],
      inviteLink: "https://discord.gg/nZscAGAQTb",
      homepageLink: "https://crowd.dev",
      tenantSlug: tenantSlug,
      tenant: "crowd.dev",
      activitiesBodies: [],
      views: 0,
    };
    let activities = [];
    let bodies = [];
    for (let actN = 0; actN < nActivities; actN++) {
      bodies.push(generateActivity());
      const author = makeAuthor();
      activities.push({
        timestamp: timestamps[actN],
        body: generateActivity(),
        author,
      });
    }
    conversation.activities = activities;
    conversation.activitiesBodies = bodies;
    conversation.lastActive = conversation.activities[0].timestamp;
    out.push(conversation);
  }
  out.push({
    title: "title 1",
    id: `424242-${tenantSlug}`,
    platform: "discord",
    tenant: "crowd.dev",
    tenantSlug: tenantSlug,
    channel: "chat",
    lastActive: 1588888808,
    slug: "title-1",
    activitiesBodies: [
      "title 1 unedited here body",
      "body unique 1",
      "body unique 2",
      "unique 3",
    ],
    activities: [
      {
        timestamp: 1588888008,
        author: "AU",
        conversationStarter: true,
      },
      {
        timestamp: 1588888808,
        author: "JR",
        crowdInfo: {
          attachments: [
            {
              id: "970587696546324510",
              url: "https://cdn.discordapp.com/attachments/968085326893568053/970587696546324510/letsgooo.png",
              fileName: "letsgooo.png",
              createdAt: 1651476539504,
              mediaType: "image/png",
            },
            {
              id: "970587696546324510",
              url: "https://cdn.discordapp.com/attachments/968085326893568053/968852477283827802/sssss.png",
              fileName: "letsgooo.png",
              createdAt: 1651476539504,
              mediaType: "image/png",
            },
          ],
        },
      },
      {
        timestamp: 1588888888,
        author: "JD",
      },
      {
        timestamp: 1588889808,
        author: "JR",
      },
    ],
  });
  return out;
}

const documents = makeDocuments();

const client = new MeiliSearch({
  host: process.env.SEARCH_ENGINE_HOST,
  apiKey: process.env.SEARCH_ENGINE_API_KEY,
});

// client.deleteIndex(process.env.CONVERSATIONS_INDEX);
// client.deleteIndex(process.env.SETTINGS_INDEX);

client
  .index(process.env.CONVERSATIONS_INDEX)
  .updateFilterableAttributes([
    "platform",
    "slug",
    "channel",
    "tenantSlug",
    "homepageLink",
    "inviteLink",
  ]);
client
  .index(process.env.CONVERSATIONS_INDEX)
  .updateSearchableAttributes(["title", "activitiesBodies"]);
client
  .index(process.env.CONVERSATIONS_INDEX)
  .updateSortableAttributes(["lastActive", "views"]);

client
  .index(process.env.CONVERSATIONS_INDEX)
  .addDocuments(documents)
  .then((res) => console.log(res));

client
  .index(process.env.SETTINGS_INDEX)
  .updateFilterableAttributes(["tenantSlug", "id", "customUrl"]);

client
  .index(process.env.SETTINGS_INDEX)
  .addDocuments([
    {
      inviteLinks: { discord: "https://discord.gg/nZscAGAQTb" },
      homepageLink: "https://crowd.dev",
      tenantSlug: "crowddev",
      tenantName: "crowd.dev",
      customUrl: "crowddev",
      id: "tenant-1",
      faviconUrl:
        "https://seeklogo.com/images/P/prisma-logo-3805665B69-seeklogo.com.png",
      logoUrl:
        "https://seeklogo.com/images/P/prisma-logo-3805665B69-seeklogo.com.png",
      theme: {
        primary: "#5cebdf",
        secondary: "#ffb59e",
        text: "#ffdd75",
        textSecondary: "#a1b6a1",
        textCta: "#d93920",
        bg: "#081c08",
        bgHighlight: "#144914",
        bgNav: "#193ed2",
      },
    },
  ])
  .then((res) => console.log(res));

client
  .index(process.env.SETTINGS_INDEX)
  .addDocuments([
    {
      inviteLinks: { discord: "https://discord.gg/nZscAGAQTb" },
      homepageLink: "https://crowd.dev",
      tenantSlug: "freeplan",
      tenantName: "free plan",
      id: "tenant-free",
    },
  ])
  .then((res) => console.log(res));

const newDocuments = makeDocuments("freeplan");
client
  .index(process.env.CONVERSATIONS_INDEX)
  .addDocuments(newDocuments)
  .then((res) => console.log(res));
