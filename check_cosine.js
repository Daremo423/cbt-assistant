const tf = require('@tensorflow/tfjs');
const a = tf.tensor1d([1, 0, 0]);
const b = tf.tensor1d([0, 1, 0]); // Orthogonal, sim 0, dist 1
const c = tf.tensor1d([1, 0, 0]); // Identical, sim 1, dist 0

const dist1 = tf.losses.cosineDistance(a, b, 0);
const dist2 = tf.losses.cosineDistance(a, c, 0);

console.log('Dist orthogonal:', dist1.dataSync()[0]);
console.log('Dist identical:', dist2.dataSync()[0]);

// Formula used: .neg().add(1)
console.log('Sim orthogonal:', dist1.neg().add(1).dataSync()[0]);
console.log('Sim identical:', dist2.neg().add(1).dataSync()[0]);
