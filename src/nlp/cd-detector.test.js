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
    mul: jest.fn((a, b) => mockTensor),
    sum: jest.fn((tensor) => createMockSqueezedTensor(0.9)),
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
    tf.sum.mockReturnValue(createMockSqueezedTensor(0.1));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock sum to return high similarity
    tf.sum.mockReturnValue(createMockSqueezedTensor(0.95));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
