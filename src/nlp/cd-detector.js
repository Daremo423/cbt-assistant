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
  'Emotional Reasoning': [
    "I feel like a failure, so I must be one.",
    "I feel overwhelmed, so the situation must be impossible.",
    "I feel guilty, so I must have done something wrong.",
    "I feel scared, so there must be danger."
  ],
  'Jumping to Conclusions': [
    "They didn't text back, they must be angry with me.",
    "I know I'm going to mess this up.",
    "He looked at me funny, he definitely dislikes me.",
    "It's going to be a disaster, I just know it."
  ],
  'Magnification/Minimization': [
    "My achievement doesn't count, anyone could do it.",
    "This small mistake ruins everything.",
    "Getting that promotion was just luck.",
    "This error proves I am incompetent."
  ]
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

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.8; // Higher threshold: only catches very strong matches (obvious)
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.6; // Lower threshold: catches more subtle matches
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

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}