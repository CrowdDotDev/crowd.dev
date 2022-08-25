import { MeiliSearch } from "meilisearch";
import dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

// If we are in development, we need to get the environment from the backend root folder
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: "./../../backend/.env" });
}

export default function initSearch() {
  return new MeiliSearch({
    host: process.env.SEARCH_ENGINE_HOST,
    apiKey: process.env.SEARCH_ENGINE_API_KEY,
  });
}
