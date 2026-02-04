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

// Function to calculate cosine similarity manually
function cosineSimilarity(vec1, vec2) {
    const v1 = vec1.dataSync();
    const v2 = vec2.dataSync();
    let dot = 0.0;
    let norm1 = 0.0;
    let norm2 = 0.0;
    for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
        norm1 += v1[i] * v1[i];
        norm2 += v2[i] * v2[i];
    }
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// sensitivity: 'low', 'medium', 'high'
// Inverted logic: 'low' sensitivity uses a higher threshold to catch only obvious distortions.
// 'high' sensitivity uses a lower threshold to catch subtle ones.
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.8; // Higher threshold for less sensitive detection (fewer matches)
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.6; // Lower threshold for more sensitive detection (more matches)
      break;
    default:
      threshold = 0.7;
  }

  for (const cdType in cdReferenceEmbeddings) {
    const similarity = cosineSimilarity(textEmbedding.squeeze(), cdReferenceEmbeddings[cdType]);
    if (similarity > threshold) {
      detectedCDs.push(cdType);
    }
  }

  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}
