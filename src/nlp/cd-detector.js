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
    // We want to keep the averaged embedding, so we don't dispose it.
    // But we must dispose the batch embeddings tensor.
    const averagedEmbedding = tf.tidy(() => {
        return tf.mean(embeddings, 0);
    });
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
    embeddings.dispose();
  }
}

// Function to calculate cosine similarity between two tensors
function cosineSimilarity(vec1, vec2) {
  // We use tf.tidy inside the loop in detectCDs, or let the caller handle disposal.
  // Here we just return the tensor ops.
  // tf.metrics.cosineProximity returns the negative cosine similarity.
  // So we negate it to get the positive cosine similarity (1 for identical vectors).
  return tf.metrics.cosineProximity(vec1, vec2).neg();
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
    const isMatch = tf.tidy(() => {
        const similarity = cosineSimilarity(textEmbedding.squeeze(), cdReferenceEmbeddings[cdType]);
        return similarity.dataSync()[0] > threshold;
    });

    if (isMatch) {
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
