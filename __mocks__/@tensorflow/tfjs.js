
const mockTensorFactory = (dataSyncValue = [0.5]) => {
  const tensor = {
    dataSync: jest.fn(() => dataSyncValue),
    dispose: jest.fn(),
    squeeze: jest.fn(() => mockTensorFactory(dataSyncValue)),
    div: jest.fn(() => mockTensorFactory(dataSyncValue)),
    mul: jest.fn(() => mockTensorFactory(dataSyncValue)),
    sub: jest.fn(() => mockTensorFactory(dataSyncValue)),
    norm: jest.fn(() => mockTensorFactory(dataSyncValue)),
    sum: jest.fn(() => mockTensorFactory(dataSyncValue)),
    mean: jest.fn(() => mockTensorFactory(dataSyncValue)),
  };
  return tensor;
};

const tf = {
  tidy: jest.fn((fn) => { console.log('Manual Mock: tf.tidy called'); return fn(); }),
  mean: jest.fn(() => mockTensorFactory()),
  embed: jest.fn(),
  sum: jest.fn(() => { console.log('Manual Mock: tf.sum called'); return mockTensorFactory(); }),
  mul: jest.fn(() => mockTensorFactory()),
  norm: jest.fn(() => mockTensorFactory()),
  tensor1d: jest.fn(() => mockTensorFactory()),
  tensor2d: jest.fn(() => mockTensorFactory()),
  // Helper to create tensors in tests if needed
  __createMockTensor: mockTensorFactory
};

module.exports = tf;
