
import { getURLReport } from "./services/virusTotalService.js";

const test = async () => {
    console.log("Testing VirusTotal connection...");

    const result = await getURLReport("https://0000bbffxzzzz900.000webhostapp.com");

    console.log("VirusTotal Response:");
    console.log(result);
};

test();
