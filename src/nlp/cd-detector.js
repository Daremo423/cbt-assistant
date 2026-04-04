// src/nlp/cd-detector.js
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model;
let modelLoadingPromise = null;
let cdReferenceEmbeddings = {};

const cdExamples = {
  'All-or-Nothing': [
    "I always fail at everything.",
    "Nobody ever listens to me.",
    "This is completely ruined.",
    "If I don't get this perfect, I'm a total failure."
  ],
  'Should Statements': [
    "I should always be happy.",
    "People ought to agree with me.",
    "I must never make mistakes.",
    "You have to understand my point of view."
  ],
  'Labeling': [
    "I am such a loser.",
    "He is an idiot.",
    "I'm completely worthless.",
    "She's a failure."
  ],
  'Catastrophizing': [
    "This is going to be a disaster.",
    "My life is ruined.",
    "It's hopeless, nothing will ever get better.",
    "This is the worst thing that could ever happen."
  ],
  // Add more examples for other cognitive distortion types as needed
};

async function loadModel() {
  if (model) return;
  if (!modelLoadingPromise) {
    modelLoadingPromise = (async () => {
      console.log("Loading Universal Sentence Encoder model...");
      model = await use.load();
      console.log("Model loaded. Generating reference embeddings...");
      await generateReferenceEmbeddings();
      console.log("Reference embeddings generated.");
    })();
  }
  await modelLoadingPromise;
}

async function generateReferenceEmbeddings() {
  const cdTypes = Object.keys(cdExamples);
  await Promise.all(
    cdTypes.map(async (cdType) => {
      const examples = cdExamples[cdType];
      const embeddings = await model.embed(examples);
      const averagedEmbedding = tf.tidy(() => tf.mean(embeddings, 0));
      cdReferenceEmbeddings[cdType] = averagedEmbedding;
      embeddings.dispose();
    })
  );
}

// Function to calculate cosine similarity between two tensors
function cosineSimilarity(vec1, vec2) {
  return tf.tidy(() => tf.losses.cosineDistance(vec1, vec2, -1).neg().add(1));
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  await loadModel();

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);
  const textEmbeddingSqueezed = textEmbedding.squeeze();

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.6; // Lower threshold for less sensitive detection
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.8; // Higher threshold for more sensitive detection
      break;
    default:
      threshold = 0.7;
  }

  for (const cdType in cdReferenceEmbeddings) {
    const similarity = cosineSimilarity(textEmbeddingSqueezed, cdReferenceEmbeddings[cdType]);
    const simValue = await similarity.data();
    if (simValue[0] > threshold) {
      detectedCDs.push(cdType);
    }
    similarity.dispose();
  }

  textEmbeddingSqueezed.dispose();
  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs };