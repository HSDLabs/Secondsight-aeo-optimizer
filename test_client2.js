import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
import client from "./server/services/externalWeb/scrapeBadger.js";

async function test() {
    try {
        console.log(Object.keys(client.google.news));
        const res = await client.google.news.search({ q: "Nike", tbm: "nws" });
        console.log("Found:", res?.organic?.length || res?.news_results?.length || res?.articles?.length, "news articles");
        console.log(res?.organic?.[0] || res?.news_results?.[0] || res?.articles?.[0] || "No articles returned");
    } catch (e) {
        console.error(e);
    }
}
test();
