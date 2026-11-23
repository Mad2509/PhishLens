
import { checkURLHaus } from "./services/urlHausService.js";

const test = async () => {
    console.log("Testing URLhaus connection...");

    const result = await checkURLHaus(
        "https://www.googel.com/"
    );

    console.log("URLhaus Response:");
    console.log(result);
};

test();
