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
// Takes 1D tensors (vectors) as input
function cosineSimilarity(vec1, vec2) {
  return tf.tidy(() => {
    const dotProduct = tf.sum(tf.mul(vec1, vec2));
    const norm1 = tf.norm(vec1);
    const norm2 = tf.norm(vec2);
    return dotProduct.div(norm1.mul(norm2));
  });
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);
  // squeeze() returns a new tensor, so we must manage its memory
  const textVector = textEmbedding.squeeze();

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

  for (const cdType in cdReferenceEmbeddings) {
    // Wrap the similarity calculation in tidy is handled inside cosineSimilarity,
    // but the result tensor needs to be disposed.
    const similarity = cosineSimilarity(textVector, cdReferenceEmbeddings[cdType]);
    const score = similarity.dataSync()[0];
    similarity.dispose();

    if (score > threshold) {
      detectedCDs.push(cdType);
    }
  }

  textVector.dispose();
  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}