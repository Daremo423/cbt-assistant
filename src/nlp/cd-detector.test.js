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
  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensor), // Always return mockTensor
    losses: {
      ...originalTf.losses,
      cosineDistance: jest.fn((vec1, vec2) => createMockSqueezedTensor(0.9)), // Default high similarity
    },
    tensor2d: jest.fn(() => mockTensor),
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
    // Simulate low similarity for all CDs
    tf.losses.cosineDistance.mockReturnValue(createMockSqueezedTensor(0.1));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock cosineDistance to return high similarity for the relevant CD type
    // This requires knowing the order of CD types being checked in detectCDs
    // For simplicity, we'll make all cosine distances high enough to trigger detection
    // and then filter based on the expected outcome.
    tf.losses.cosineDistance.mockImplementation((vec1, vec2) => {
      // In a real scenario, you might inspect vec1/vec2 to determine which CD is being checked
      // For now, we'll just return a high similarity for all.
      return createMockSqueezedTensor(0.95);
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect distortion at high sensitivity but not low sensitivity for borderline similarity', async () => {
    // Set similarity to 0.65 (between 0.6 and 0.8)
    // Note: The mock createMockSqueezedTensor preserves the value through .neg() and .add().
    // So we are mocking the *final calculated similarity* to be 0.65, not the raw distance.
    tf.losses.cosineDistance.mockImplementation(() => createMockSqueezedTensor(0.65));

    const text = 'I am somewhat failing.';

    // Check High Sensitivity (Threshold 0.6) -> Should detect
    const highResult = await detectCDs(text, 'high');
    expect(highResult.length).toBeGreaterThan(0);

    // Check Low Sensitivity (Threshold 0.8) -> Should NOT detect
    const lowResult = await detectCDs(text, 'low');
    expect(lowResult).toEqual([]);
  });
});
