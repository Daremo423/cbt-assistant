// src/nlp/cd-detector.js
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model;
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
  if (!model) {
    console.log("Loading Universal Sentence Encoder model...");
    model = await use.load();
    console.log("Model loaded. Generating reference embeddings...");
    await generateReferenceEmbeddings();
    console.log("Reference embeddings generated.");
  }
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
  return tf.losses.cosineDistance(vec1, vec2, -1).neg().add(1);
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
    const similarity = cosineSimilarity(textEmbedding.squeeze(), cdReferenceEmbeddings[cdType]);
    if (similarity.dataSync()[0] > threshold) {
      detectedCDs.push(cdType);
    }
  }

  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs };