const tf = require('@tensorflow/tfjs');
console.log('tf.metrics:', tf.metrics);
console.log('tf.metrics.cosineDistance:', tf.metrics ? tf.metrics.cosineDistance : 'undefined');
console.log('tf.losses.cosineDistance:', tf.losses ? tf.losses.cosineDistance : 'undefined');
