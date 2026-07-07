import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
import client from "./server/services/externalWeb/scrapeBadger.js";

console.log(Object.keys(client));
console.log(client.news ? Object.keys(client.news) : "no news");
