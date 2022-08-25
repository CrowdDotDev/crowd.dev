const MeiliSearch = require("meilisearch").MeiliSearch;
require("dotenv").config();

console.log(process.env.SEARCH_ENGINE_HOST);

const client = new MeiliSearch({
  host: process.env.SEARCH_ENGINE_HOST,
  apiKey: process.env.SEARCH_ENGINE_API_KEY,
});

// const documents = [
//   // {
//   //   slug: "thejoanandonly",
//   //   id: "e78fcbbe-3b1f-4d0f-b7ce-1105fc985d0d",
//   //   logoUrl:
//   //     "https://sbp-plugin-images.s3.eu-west-1.amazonaws.com/technologies1905_5eb57bd25635d_icon.jpg",
//   //   cardColor: "#00D5FE",
//   // },
//   // Sturdy
//   {
//     slug: "sturdy",
//     id: "d02ff683-971e-42e4-997a-eac6891e0a9a",
//     logoUrl: "https://getsturdy.com/assets/logotype.ddc3be21.svg",
//     cardColor: "#0C1424",
//   },
//   // Qdrant
//   {
//     slug: "qdrant",
//     id: "38e57e57-a3b0-4b22-a858-b01aca9fcfa7",
//     logoUrl: "https://qdrant.tech/images/logo_with_text.svg",
//     cardColor: "#F8F9FA",
//   },
//   // Code intelligence
//   {
//     slug: "code-intelligence-community",
//     id: "2837b0b2-e0ec-42ea-97b6-c34226491b1a",
//     logoUrl:
//       "https://www.code-intelligence.com/hs-fs/hubfs/Logos/CI%20Logos/Logo_quer_wei%C3%9F-1.png?width=2400&height=800&name=Logo_quer_wei%C3%9F-1.png",
//     cardColor: "#000000",
//   },
//   // ImpDAO
//   {
//     slug: "ImpDAO",
//     id: "e9b0ea73-92ec-4b5e-b801-da0072dc198e",
//     logoUrl: "https://impdao.finance/static/media/imp_white.f1cff6cd.svg",
//     cardColor: "#981210",
//   },
// ];

// for (const doc of documents) {
client
  .index(process.env.SETTINGS_INDEX)
  .deleteDocument("e78fcbbe-3b1f-4d0f-b7ce-1105fc985d0d")
  .then((res) => console.log(res));
// }
