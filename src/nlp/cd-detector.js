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
    const averagedEmbedding = tf.tidy(() => tf.mean(embeddings, 0));
    embeddings.dispose();
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
  }
}

// Function to calculate cosine similarity between two tensors using manual dot product
function cosineSimilarity(vec1, vec2) {
  return tf.tidy(() => tf.sum(tf.mul(vec1, vec2)));
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  const textEmbedding = await model.embed([text]);
  const textVector = tf.tidy(() => textEmbedding.squeeze());
  textEmbedding.dispose();

  let threshold;
  // Inverse relationship: High sensitivity -> Low threshold (detects more)
  // Low sensitivity -> High threshold (detects less)
  switch (sensitivity) {
    case 'low':
      threshold = 0.8;
      break;
    case 'medium':
      threshold = 0.7;
      break;
    case 'high':
      threshold = 0.6;
      break;
    default:
      threshold = 0.7;
  }

  for (const cdType in cdReferenceEmbeddings) {
    const similarity = cosineSimilarity(textVector, cdReferenceEmbeddings[cdType]);
    const score = (await similarity.data())[0];
    similarity.dispose();

    if (score > threshold) {
      detectedCDs.push(cdType);
    }
  }

  textVector.dispose();
  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}
