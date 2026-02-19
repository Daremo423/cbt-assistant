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

const mockScalar = (val = 0.8) => ({
    div: jest.fn(() => mockScalar(val)),
    mul: jest.fn(() => mockScalar(val)),
    data: jest.fn(() => Promise.resolve([val])),
    dataSync: jest.fn(() => [val]),
    dispose: jest.fn(),
});

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensor), // Always return mockTensor
    mul: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockScalar(0.8)),
    norm: jest.fn(() => mockScalar(1.0)),
    tidy: jest.fn((fn) => fn()),
    metrics: {
      ...originalTf.metrics,
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
    // tf.sum returns the dot product. We need to mock it to return a value that results in low similarity.
    // Logic: similarity = dot / (norm1 * norm2). If norms are 1, similarity = dot.
    tf.sum.mockReturnValue(mockScalar(0.1));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock sum to return high similarity
    tf.sum.mockReturnValue(mockScalar(0.95));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'low'); // 'low' sensitivity uses 0.8 threshold
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
