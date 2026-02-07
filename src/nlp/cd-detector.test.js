
jest.mock('@tensorflow/tfjs', () => ({
  mean: jest.fn(() => 'mockMeanEmbedding'),
  mul: jest.fn(() => 'mockMultiplied'),
  sum: jest.fn(() => ({
    dataSync: jest.fn(() => [0.9]), // Default
  })),
  metrics: {
    cosineDistance: jest.fn(),
  },
}));

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

describe('detectCDs', () => {
  let detectCDs;
  let use;
  let mockModel;
  let tf;

  beforeEach(() => {
    jest.resetModules(); // Reset cache

    // Re-require modules
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');
    const cdDetector = require('./cd-detector');
    detectCDs = cdDetector.detectCDs;

    mockModel = {
      embed: jest.fn().mockResolvedValue({
        squeeze: jest.fn().mockReturnValue('mockSqueezed'),
        dispose: jest.fn(),
      }),
    };
    use.load.mockResolvedValue(mockModel);

    // Reset tf.sum mock to default
    tf.sum.mockImplementation(() => ({
        dataSync: jest.fn(() => [0.9])
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should detect distortions when similarity is high', async () => {
    const result = await detectCDs('I am a failure');
    expect(result.length).toBeGreaterThan(0);
    expect(tf.sum).toHaveBeenCalled();
  });

  test('should not detect distortions when similarity is low', async () => {
    tf.sum.mockImplementation(() => ({
        dataSync: jest.fn(() => [0.1])
    }));

    const result = await detectCDs('I am happy');
    expect(result).toEqual([]);
  });

  test('should obey sensitivity thresholds', async () => {
    tf.sum.mockImplementation(() => ({
        dataSync: jest.fn(() => [0.65])
    }));

    // High sensitivity (threshold 0.6) -> should detect
    let result = await detectCDs('text', 'high');
    expect(result.length).toBeGreaterThan(0);

    // Medium sensitivity (threshold 0.7) -> should NOT detect
    result = await detectCDs('text', 'medium');
    expect(result).toEqual([]);

    // Low sensitivity (threshold 0.8) -> should NOT detect
    result = await detectCDs('text', 'low');
    expect(result).toEqual([]);
  });
});
