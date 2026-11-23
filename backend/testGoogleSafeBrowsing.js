
import {
    checkGoogleSafeBrowsing
} from "./services/googleSafeBrowsingService.js";

const test = async () => {
    console.log("Testing Google Safe Browsing...");

    const result = await checkGoogleSafeBrowsing(
        "https://www.charmetmoi.fr/tools/zw/"
    );

    console.log("Google Safe Browsing Response:");
    console.log(result);
};

test();
