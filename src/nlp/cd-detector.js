// src/nlp/cd-detector.js
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model;
let modelLoadingPromise;
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
  if (model) return model;

  if (!modelLoadingPromise) {
    modelLoadingPromise = (async () => {
      console.log("Loading Universal Sentence Encoder model...");
      model = await use.load();
      console.log("Model loaded. Generating reference embeddings...");
      await generateReferenceEmbeddings();
      console.log("Reference embeddings generated.");
      return model;
    })();
  }

  return await modelLoadingPromise;
}

async function generateReferenceEmbeddings() {
  const cdTypes = Object.keys(cdExamples);

  await Promise.all(cdTypes.map(async (cdType) => {
    const examples = cdExamples[cdType];
    const embeddings = await model.embed(examples);
    const averagedEmbedding = tf.mean(embeddings, 0); // Average across the examples
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
    embeddings.dispose(); // Explicit dispose
  }));
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);
  const squeezedEmbedding = textEmbedding.squeeze();

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.8; // Lower sensitivity uses a high threshold
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.6; // Higher sensitivity uses a low threshold
      break;
    default:
      threshold = 0.7;
  }

  for (const cdType in cdReferenceEmbeddings) {
    const similarity = tf.tidy(() => tf.losses.cosineDistance(squeezedEmbedding, cdReferenceEmbeddings[cdType], -1).neg().add(1));
    const similarityValue = similarity.dataSync()[0];

    if (similarityValue > threshold) {
      detectedCDs.push(cdType);
    }
    similarity.dispose();
  }

  squeezedEmbedding.dispose();
  textEmbedding.dispose();

  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}