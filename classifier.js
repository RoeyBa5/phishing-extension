import fs from 'fs';
import {pipeline} from '@huggingface/transformers';
import {env} from '@huggingface/transformers';

async function classifyUrl(url) {
    // clear the cache manually
    const cacheDir = env.cacheDir || `${process.env.HOME}/.cache/huggingface/transformers`;
    fs.rmSync(cacheDir, {recursive: true, force: true});

    const classifier = await pipeline(
        'text-classification',  'roeyba5/urlbert-tiny-v4-phishing-classifier-xenova', {
            device: "auto",
        });
    const labels = ['phishing', 'safe'];
    const startTime = Date.now();
    const result = await classifier(url);
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    console.log("Elapsed time:", elapsedTime, "ms");
    return result;
}

console.log("Classifying URL:", "https://google.com");
classifyUrl("https://weebly.com/").then((result) => {
    console.log("Classification result:", result);
}).catch((error) => {
    console.error("Error classifying URL:", error);
})