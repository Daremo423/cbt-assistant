let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

// We need to define the mocks so they are accessible, but jest.mock runs first.
// A common pattern is to just define basic structure in mock, and then refine in tests.

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');

  const mockTensorResult = {
      dataSync: jest.fn(() => [0.9]),
      dispose: jest.fn()
  };

  const mockTensor = {
      squeeze: jest.fn(() => mockTensorResult),
      dispose: jest.fn()
  };

  return {
    ...originalTf,
    mean: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockTensorResult),
    tensor2d: jest.fn(() => mockTensor),
  };
});

describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;

  // Helper to create a result tensor
  const createMockResult = (val) => ({
      dataSync: jest.fn(() => [val]),
      dispose: jest.fn()
  });

  beforeEach(() => {
    jest.resetModules();
    ({ detectCDs } = require('./cd-detector'));
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    const mockTensor = {
        squeeze: jest.fn(() => createMockResult(0.9)),
        dispose: jest.fn()
    };

    mockEmbed = jest.fn(() => Promise.resolve(mockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity (sum result)
    tf.sum.mockReturnValue(createMockResult(0.1));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);

    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity
    // detectCDs uses tf.sum(tf.mul(...))
    // We mock tf.sum to return a high value
    tf.sum.mockReturnValue(createMockResult(0.95));

    const text = 'I always fail at everything.';
    // sensitivity 'high' uses threshold 0.6. 0.95 > 0.6.
    const result = await detectCDs(text, 'high');

    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
