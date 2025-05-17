import fs from 'fs';
import {pipeline} from '@huggingface/transformers';
import {env} from '@huggingface/transformers';

async function classifyUrl(url) {
    // clear the cache manually
    const cacheDir = env.cacheDir || `${process.env.HOME}/.cache/huggingface/transformers`;
    fs.rmSync(cacheDir, {recursive: true, force: true});

    const classifier = await pipeline(
        'text-classification',  'roeyba5/phishinglang-xenova', {
            device: "auto",
        });
    const labels = ['phishing', 'safe'];
    const result = await classifier(url);
    return result;
}

// load content from content.txt file
const content = fs.readFileSync('content.txt', 'utf8');
console.log("Content:", content);
// console.log("Classifying URL:", "https://google.com");
classifyUrl(content).then((result) => {
    console.log("Classification result:", result);
}).catch((error) => {
    console.error("Error classifying URL:", error);
})