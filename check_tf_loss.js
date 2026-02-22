const tf = require('@tensorflow/tfjs');
const a = tf.tensor1d([1, 0]);
const b = tf.tensor1d([0, 1]); // Orthogonal, sim = 0, dist = 1
const c = tf.tensor1d([1, 0]); // Same, sim = 1, dist = 0

const dist1 = tf.losses.cosineDistance(a, b, 0);
const dist2 = tf.losses.cosineDistance(a, c, 0);

console.log('Dist(a,b):', dist1.dataSync()[0]);
console.log('Dist(a,c):', dist2.dataSync()[0]);

// Check manual
const simManual = a.dot(b).div(a.norm().mul(b.norm()));
console.log('Manual Sim(a,b):', simManual.dataSync()[0]);
