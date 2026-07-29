let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockSqueezedTensor = (similarityValue = 0.9) => ({
  neg: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  add: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  dataSync: jest.fn(() => [similarityValue]),
  dispose: jest.fn(),
});

const mockTensor = {
  squeeze: jest.fn(() => createMockSqueezedTensor()),
  dispose: jest.fn(),
};

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  // Helper for mock factory (duplicated because factory is hoisted)
  const createMockSqueezedTensorInside = (similarityValue = 0.9) => ({
    neg: jest.fn(() => createMockSqueezedTensorInside(similarityValue)),
    add: jest.fn(() => createMockSqueezedTensorInside(similarityValue)),
    dataSync: jest.fn(() => [similarityValue]),
    dispose: jest.fn(),
  });

  const mockTensorInside = {
      squeeze: jest.fn(() => createMockSqueezedTensorInside()),
      dispose: jest.fn(),
  };

  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensorInside),
    mul: jest.fn((t1, t2) => mockTensorInside),
    sum: jest.fn((t) => createMockSqueezedTensorInside(0.9)),
    tensor2d: jest.fn(() => mockTensorInside),
    equal: jest.fn(() => ({
      all: jest.fn(() => ({
        dataSync: jest.fn(() => [1]),
      })),
    })),
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

    mockEmbed = jest.fn(() => Promise.resolve(mockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity (0.1) which is below all thresholds
    tf.sum.mockReturnValue(createMockSqueezedTensor(0.1));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion with high similarity', async () => {
    // 0.95 > 0.6 (high sens), 0.7 (med sens), 0.8 (low sens)
    tf.sum.mockReturnValue(createMockSqueezedTensor(0.95));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high'); // high sensitivity = 0.6 threshold
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should respect sensitivity thresholds', async () => {
      // Thresholds: Low=0.8, Medium=0.7, High=0.6

      // Case 1: Similarity 0.65.
      // Should be detected at High (0.6) but NOT Medium (0.7) or Low (0.8)
      tf.sum.mockReturnValue(createMockSqueezedTensor(0.65));

      let result = await detectCDs('text', 'high');
      expect(result.length).toBeGreaterThan(0); // 0.65 > 0.6

      result = await detectCDs('text', 'medium');
      expect(result.length).toBe(0); // 0.65 < 0.7

      // Case 2: Similarity 0.75
      // Should be detected at Medium (0.7) but NOT Low (0.8)
      tf.sum.mockReturnValue(createMockSqueezedTensor(0.75));

      result = await detectCDs('text', 'medium');
      expect(result.length).toBeGreaterThan(0); // 0.75 > 0.7

      result = await detectCDs('text', 'low');
      expect(result.length).toBe(0); // 0.75 < 0.8
  });
});
