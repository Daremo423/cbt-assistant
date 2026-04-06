let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockSqueezedTensor = (similarityValue = 0.9) => ({
  neg: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  add: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  data: jest.fn(() => Promise.resolve([similarityValue])),
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
    tidy: jest.fn((fn) => fn()),
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

    // Due to resetMocks, we need to reassign these inside beforeEach
    mockTensor.squeeze.mockImplementation(() => createMockSqueezedTensor());
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
    tf.losses.cosineDistance.mockImplementation((vec1, vec2) => {
      return createMockSqueezedTensor(0.95);
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
