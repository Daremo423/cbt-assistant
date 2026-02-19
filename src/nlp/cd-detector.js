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
  // Use tf.tidy to clean up intermediate tensors during embedding generation
  // But wait, model.embed is async, so we can't use tidy around it easily for the whole process.
  // We'll manage disposal manually or scope tidy for synchronous parts.

  for (const cdType in cdExamples) {
    const examples = cdExamples[cdType];
    const embeddings = await model.embed(examples);

    // Calculate mean embedding
    const averagedEmbedding = tf.tidy(() => {
        return tf.mean(embeddings, 0);
    });

    cdReferenceEmbeddings[cdType] = averagedEmbedding;
    embeddings.dispose(); // Dispose the batch embedding
  }
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  let threshold;
  switch (sensitivity) {
    case 'low':
      threshold = 0.8; // Higher threshold for less sensitive detection (stricter)
      break;
    case 'medium':
      threshold = 0.7; // Medium threshold
      break;
    case 'high':
      threshold = 0.6; // Lower threshold for more sensitive detection (laxer)
      break;
    default:
      threshold = 0.7;
  }

  const textEmbedding = await model.embed([text]);

  const { scores, types } = tf.tidy(() => {
    const vec1 = textEmbedding.squeeze();
    const scores = [];
    const types = [];

    for (const cdType in cdReferenceEmbeddings) {
      const vec2 = cdReferenceEmbeddings[cdType];

      // Manual cosine similarity: (A . B) / (||A|| * ||B||)
      const dotProduct = tf.sum(tf.mul(vec1, vec2));
      const norm1 = tf.norm(vec1);
      const norm2 = tf.norm(vec2);
      const similarity = dotProduct.div(norm1.mul(norm2));

      scores.push(similarity);
      types.push(cdType);
    }
    return { scores, types };
  });

  const detectedCDs = [];
  const scoreValues = await Promise.all(scores.map(s => s.data()));

  scoreValues.forEach((val, index) => {
    if (val[0] > threshold) {
      detectedCDs.push(types[index]);
    }
  });

  // Dispose tensors
  textEmbedding.dispose();
  scores.forEach(s => s.dispose());

  return detectedCDs;
}

export { detectCDs, loadModel };
