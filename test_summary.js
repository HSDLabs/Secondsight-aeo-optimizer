import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });
import { generateSummary } from "./server/services/externalWeb/summarize.js";

async function test() {
    try {
        const res = await generateSummary({ name: "Nike" }, [], []);
        console.log("RESULT:", res);
    } catch (e) {
        console.error("TEST ERR:", e);
    }
}
test();
