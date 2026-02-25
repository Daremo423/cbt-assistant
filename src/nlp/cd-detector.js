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
    // Use tf.tidy for operations, keep the result
    const averagedEmbedding = tf.tidy(() => tf.mean(embeddings, 0));
    embeddings.dispose();
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
  }
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
      threshold = 0.8; // Higher threshold -> Fewer detections
      break;
    case 'medium':
      threshold = 0.7;
      break;
    case 'high':
      threshold = 0.6; // Lower threshold -> More detections
      break;
    default:
      threshold = 0.7;
  }

  // Use tf.tidy to clean up intermediate tensors
  const similarities = tf.tidy(() => {
    const results = {};
    const textVec = textEmbedding.reshape([1, -1]); // Ensure 2D

    for (const cdType in cdReferenceEmbeddings) {
      const refVec = cdReferenceEmbeddings[cdType].reshape([1, -1]);
      // Compute cosine similarity: 1 - cosineDistance
      // Use axis=-1 to compute across the embedding dimension (512)
      const similarity = tf.losses.cosineDistance(textVec, refVec, -1).neg().add(1);
      results[cdType] = similarity.dataSync()[0];
    }
    return results;
  });

  for (const cdType in similarities) {
    if (similarities[cdType] > threshold) {
      detectedCDs.push(cdType);
    }
  }

  textEmbedding.dispose();
  return detectedCDs;
}

export { detectCDs, loadModel };
