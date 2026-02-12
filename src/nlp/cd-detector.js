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
  // Clear any existing reference embeddings to prevent memory leaks
  for (const key in cdReferenceEmbeddings) {
      if (cdReferenceEmbeddings[key]) {
          cdReferenceEmbeddings[key].dispose();
      }
  }
  cdReferenceEmbeddings = {};

  for (const cdType in cdExamples) {
    const examples = cdExamples[cdType];
    const embeddings = await model.embed(examples);
    const averagedEmbedding = tf.tidy(() => tf.mean(embeddings, 0)); // Average across the examples
    embeddings.dispose();
    cdReferenceEmbeddings[cdType] = averagedEmbedding;
  }
}

// Function to calculate cosine similarity between two tensors manually
// Using tf.tidy() is crucial for memory management, but here we return a tensor
// so the caller must dispose it.
function cosineSimilarity(vec1, vec2) {
  return tf.tidy(() => {
    const dotProduct = tf.sum(tf.mul(vec1, vec2));
    const mag1 = tf.sqrt(tf.sum(tf.square(vec1)));
    const mag2 = tf.sqrt(tf.sum(tf.square(vec2)));
    return dotProduct.div(mag1.mul(mag2));
  });
}

// sensitivity: 'low', 'medium', 'high'
async function detectCDs(text, sensitivity = 'medium') {
  if (!model) {
    await loadModel();
  }

  const detectedCDs = [];
  // Calculate text embedding
  const textEmbedding = await model.embed([text]);
  const textVector = textEmbedding.squeeze();
  textEmbedding.dispose(); // Dispose the batch tensor immediately

  let threshold;
  // Inverted logic: Low sensitivity = High threshold (strict matching)
  // High sensitivity = Low threshold (lenient matching)
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

  try {
    for (const cdType in cdReferenceEmbeddings) {
      const refVector = cdReferenceEmbeddings[cdType];

      const similarityTensor = cosineSimilarity(textVector, refVector);
      const similarityValue = (await similarityTensor.data())[0];
      similarityTensor.dispose();

      if (similarityValue > threshold) {
        detectedCDs.push(cdType);
      }
    }
  } finally {
    textVector.dispose();
  }

  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}
