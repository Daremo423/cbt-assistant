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
  if (model) return model;

  if (!modelLoadingPromise) {
    modelLoadingPromise = (async () => {
      console.log("Loading Universal Sentence Encoder model...");
      const loadedModel = await use.load();
      model = loadedModel;
      console.log("Model loaded. Generating reference embeddings...");
      await generateReferenceEmbeddings();
      console.log("Reference embeddings generated.");
      return model;
    })();
  }

  return modelLoadingPromise;
}

async function generateReferenceEmbeddings() {
  for (const cdType in cdExamples) {
    const examples = cdExamples[cdType];
    const embeddings = await model.embed(examples);
    const averagedEmbedding = tf.mean(embeddings, 0); // Average across the examples
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
  }
}

// Function to calculate cosine similarity between two tensors
function cosineSimilarity(vec1, vec2) {
  // cosineDistance returns 1 - cosine_similarity
  // We want similarity, so we compute (1 - distance) which is (1 - (1 - sim)) = sim
  // But wait, the original logic was .neg().add(1) which implies input was distance?
  // Original logic: input.neg().add(1) = -input + 1 = 1 - input.
  // If input is distance (1-sim), then 1 - (1-sim) = sim.
  // So yes, tf.losses.cosineDistance returns distance, so we just negate and add 1.
  return tf.losses.cosineDistance(vec1, vec2, 0).neg().add(1);
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.8; // Higher threshold for less sensitive detection (fewer false positives)
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.6; // Lower threshold for more sensitive detection (detects weaker signals)
      break;
    default:
      threshold = 0.7;
  }

  const squeezedTextEmbedding = textEmbedding.squeeze();

  for (const cdType in cdReferenceEmbeddings) {
    const similarity = cosineSimilarity(squeezedTextEmbedding, cdReferenceEmbeddings[cdType]);
    const score = await similarity.data();
    if (score[0] > threshold) {
      detectedCDs.push(cdType);
    }
    similarity.dispose();
  }

  squeezedTextEmbedding.dispose();
  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs };

// Initial model load removed to support lazy loading