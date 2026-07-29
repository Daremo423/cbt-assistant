let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockTensor = (value = 0.5) => ({
  dataSync: jest.fn(() => [value]),
  dispose: jest.fn(),
  div: jest.fn(() => createMockTensor(value)),
  mul: jest.fn(() => createMockTensor(value)),
  squeeze: jest.fn(() => createMockTensor(value)),
});

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => {
  return {
    tidy: jest.fn((fn) => fn()),
    sum: jest.fn(() => createMockTensor(0.5)),
    mul: jest.fn(() => createMockTensor(0.5)),
    norm: jest.fn(() => createMockTensor(1.0)), // Normalized vector magnitude
    mean: jest.fn(() => createMockTensor(0.5)),
    tensor2d: jest.fn(() => createMockTensor(0.5)),
    ready: jest.fn(() => Promise.resolve()),
  };
});

describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;

  beforeEach(() => {
    jest.resetModules();

    // We must define helper functions inside the scope or make them available before imports
    // Re-import modules to ensure mocks are applied freshly
    ({ detectCDs } = require('./cd-detector'));
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    // Default mock behavior
    mockEmbed = jest.fn(() => Promise.resolve(createMockTensor(0.5)));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity (dot product result)
    // The manual calculation is dot(A,B) / (norm(A)*norm(B))
    // We control the result via the final .div() return in the chain,
    // or by mocking the internal operations.
    // In our simplified mock, tf.sum, tf.mul etc return a mock tensor.
    // The final result comes from dotProduct.div(...)
    // Let's force the final result of the calculation to be low (e.g. 0.1)

    // Create a specific mock tensor that returns 0.1 for dataSync
    const lowSimilarityTensor = createMockTensor(0.1);

    // We need to control what the cosineSimilarity function returns.
    // Since cosineSimilarity uses tf.sum, tf.norm, etc., we can mock the final operation in the chain.
    // The chain ends with .div().
    // However, it's easier to mock the individual TF ops if we want granular control,
    // or just ensure the default mock returns a value < threshold.

    // The default createMockTensor(0.5) is used. Thresholds are 0.6, 0.7, 0.8.
    // 0.5 < 0.6 (High sensitivity threshold), so it should return empty for all sensitivities.

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text, 'high'); // threshold 0.6
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // We need the similarity calculation to return a high value (e.g. 0.9)
    // The calculation is: dotProduct.div(norm1.mul(norm2))
    // We can mock the return value of the *last* operation in this chain.

    const highSimilarityTensor = createMockTensor(0.95);

    // When div is called on the dotProduct tensor, return high similarity
    // We need to intercept the `div` call of the tensor returned by `tf.sum`
    const dotProductTensor = createMockTensor(0.5);
    dotProductTensor.div.mockReturnValue(highSimilarityTensor);

    tf.sum.mockReturnValue(dotProductTensor);

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium'); // threshold 0.7

    // Since we mock all cosine calculations to return 0.95, it will detect *all* CD types.
    // We just check if 'All-or-Nothing' is in the list.
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
