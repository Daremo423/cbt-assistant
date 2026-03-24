let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockSqueezedTensor = (similarityValue = 0.9) => {
  const t = {
    neg: jest.fn(() => t),
    add: jest.fn(() => t),
    dataSync: jest.fn(() => [similarityValue]),
    data: jest.fn(() => Promise.resolve([similarityValue])),
    dispose: jest.fn(),
  };
  return t;
};

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
      cosineDistance: jest.fn((vec1, vec2, axis) => createMockSqueezedTensor(0.9)), // Default high similarity
    },
    tensor2d: jest.fn(() => mockTensor),
    equal: jest.fn(() => ({
      all: jest.fn(() => ({
        dataSync: jest.fn(() => [1]),
        data: jest.fn(() => Promise.resolve([1])),
      })),
    })),
    tidy: jest.fn((fn) => fn()),
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

    // Make mockEmbed return a copy of mockTensor with its own squeeze method that returns a defined squeezed tensor.
    // Wait, the error is `Cannot read properties of undefined (reading 'dispose')` on `squeezedTextEmbedding.dispose()`.
    // It means `squeezedTextEmbedding` is undefined.
    // Why? `mockEmbed` returns `mockTensor`. `mockTensor.squeeze()` returns something.
    // Wait, `mockTensor` is defined:
    // const mockTensor = { squeeze: jest.fn(() => createMockSqueezedTensor()), dispose: jest.fn() };
    mockEmbed = jest.fn(() => Promise.resolve({
      squeeze: jest.fn(() => createMockSqueezedTensor()),
      dispose: jest.fn()
    }));
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
