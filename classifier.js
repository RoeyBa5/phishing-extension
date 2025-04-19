import {pipeline} from '@huggingface/transformers';

async function classifyUrl(url) {
    const classifier = await pipeline('text-classification','CrabInHoney/urlbert-tiny-v4-phishing-classifier');
    console.log("Classifier loaded", classifier);
    const labels = ['phishing', 'safe'];
    const result = await classifier(url);
    return result;
}

console.log("Classifying URL:", "https://google.com");
classifyUrl("https://google.com").then(
    (result) => {
        console.log("Classification result:", result);
    }
).catch(
    (error) => {
        console.error("Error classifying URL:", error);
    }
)