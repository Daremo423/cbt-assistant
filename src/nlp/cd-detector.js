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

    // Average across the examples, keeping the resulting tensor
    const averagedEmbedding = tf.tidy(() => {
        return tf.mean(embeddings, 0);
    });

    embeddings.dispose(); // Dispose the batch embeddings tensor
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
  // Inverted logic:
  // 'low' sensitivity (catch only obvious) -> higher threshold
  // 'high' sensitivity (catch subtle) -> lower threshold
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
    const cdTypes = Object.keys(cdReferenceEmbeddings);

    const similarityPromises = cdTypes.map(async (cdType) => {
        // Manual dot product calculation wrapped in tf.tidy
        const scoreTensor = tf.tidy(() => {
            const vec1 = textEmbedding.squeeze();
            const vec2 = cdReferenceEmbeddings[cdType];
            return tf.sum(tf.mul(vec1, vec2));
        });

        const data = await scoreTensor.data();
        scoreTensor.dispose();

        return { cdType, score: data[0] };
    });

    const results = await Promise.all(similarityPromises);

    results.forEach(({ cdType, score }) => {
        if (score > threshold) {
            detectedCDs.push(cdType);
        }
    });

  } finally {
    textEmbedding.dispose();
  }

  return detectedCDs;
}

export { detectCDs };

// Initial model load
if (process.env.NODE_ENV !== 'test') {
  loadModel();
}
