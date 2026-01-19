let detectCDs;
let use;
let tf;

const createMockScalar = (value) => ({
  div: jest.fn(() => createMockScalar(value)),
  mul: jest.fn(() => createMockScalar(1)),
  dataSync: jest.fn(() => [value]),
  dispose: jest.fn(),
});

describe('detectCDs', () => {
  let mockEmbed;
  let currentSimilarity = 0.9;

  const createMockSqueezedTensor = () => ({
    dot: jest.fn(() => createMockScalar(currentSimilarity)),
    norm: jest.fn(() => createMockScalar(1)),
    dispose: jest.fn(),
  });

  beforeEach(() => {
    jest.resetModules();
    currentSimilarity = 0.9;

    // This represents the 2D tensor returned by model.embed()
    const mockTensor = {
      squeeze: jest.fn(() => createMockSqueezedTensor()),
      dispose: jest.fn(),
    };

    jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
      load: jest.fn(),
    }));

    jest.doMock('@tensorflow/tfjs', () => {
        const originalTf = jest.requireActual('@tensorflow/tfjs');
        return {
            ...originalTf,
            // tf.mean returns a 1D tensor (averaged embedding), so we use createMockSqueezedTensor
            mean: jest.fn((tensor) => createMockSqueezedTensor()),
            tensor2d: jest.fn(() => mockTensor),
        };
    });

    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    mockEmbed = jest.fn(() => Promise.resolve(mockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });

    ({ detectCDs } = require('./cd-detector'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    currentSimilarity = 0.1;
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    currentSimilarity = 0.95;
    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
  });
});
