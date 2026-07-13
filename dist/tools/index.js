import { registerFetch } from "./fetch.js";
import { registerDiscover } from "./discover.js";
import { registerExtract } from "./extract.js";
export function registerTools(server) {
    registerFetch(server);
    registerDiscover(server);
    registerExtract(server);
}
