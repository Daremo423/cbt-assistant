let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');

  const createMockSqueezedTensor = (similarityValue = 0.9) => ({
    neg: jest.fn(() => createMockSqueezedTensor(similarityValue)),
    add: jest.fn(() => createMockSqueezedTensor(similarityValue)),
    dataSync: jest.fn(() => [similarityValue]),
    div: jest.fn(() => createMockSqueezedTensor(similarityValue)),
    dispose: jest.fn(),
  });

  const mockTensor = {
    squeeze: jest.fn(() => createMockSqueezedTensor()),
    dispose: jest.fn(),
    div: jest.fn(() => createMockSqueezedTensor()),
  };

  return {
    ...originalTf,
    mean: jest.fn(() => mockTensor),
    tensor2d: jest.fn(() => mockTensor),
    tidy: jest.fn((fn) => fn()),
    sum: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor),
    norm: jest.fn(() => mockTensor),
    // Expose helpers for test manipulation if needed,
    // though typically we manipulate the mocks in the tests
    // via require('@tensorflow/tfjs').someFn.mockReturnValue(...)
    _createMockSqueezedTensor: createMockSqueezedTensor,
  };
});

describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;

  beforeEach(() => {
    jest.resetModules();
    ({ detectCDs } = require('./cd-detector'));
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    // Define a local mockTensor for the embedding result
    const localMockTensor = {
      squeeze: jest.fn(() => ({
        // The squeezed tensor needs to be compatible with cosineSimilarity
        // which calls tf.mul(vec1, vec2).
        // Since we mock tf.mul to return a mock, this object's properties might not be accessed directly
        // by tf.mul, but tf.mul's mock implementation might use them if we were checking args.
        // However, in our current mock, tf.mul returns a mock regardless of input.
        dispose: jest.fn(),
      })),
      dispose: jest.fn(),
    };

    mockEmbed = jest.fn(() => Promise.resolve(localMockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity: final division result should have dataSync returning < threshold
    const lowSimTensor = {
      dataSync: jest.fn(() => [0.1]),
      dispose: jest.fn()
    };

    // We mock the chain: sum(mul) -> dotProduct, norm, norm -> mul -> div -> result
    // To simplify, we just make the final div return the lowSimTensor

    // Since we mocked 'mul' to return 'mockTensor', and 'mockTensor.div' returns a mock...
    // We need to override the behavior for this test.

    // The implementation is:
    // dotProduct = tf.sum(tf.mul(v1, v2))
    // norm1 = tf.norm(v1)
    // norm2 = tf.norm(v2)
    // return dotProduct.div(tf.mul(norm1, norm2))

    // So 'dotProduct' needs a 'div' method.
    // 'tf.sum' returns 'dotProduct'.

    const mockDotProduct = {
      div: jest.fn(() => lowSimTensor),
      dispose: jest.fn()
    };

    tf.sum.mockReturnValue(mockDotProduct);

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    const highSimTensor = {
      dataSync: jest.fn(() => [0.95]),
      dispose: jest.fn()
    };

    const mockDotProduct = {
      div: jest.fn(() => highSimTensor),
      dispose: jest.fn()
    };

    tf.sum.mockReturnValue(mockDotProduct);

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
