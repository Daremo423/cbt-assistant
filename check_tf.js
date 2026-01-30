const tf = require('@tensorflow/tfjs');
console.log('tf.metrics:', tf.metrics);
console.log('tf.losses:', tf.losses);
if (tf.metrics) console.log('cosineDistance in metrics:', 'cosineDistance' in tf.metrics);
