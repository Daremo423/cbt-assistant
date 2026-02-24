
describe('detectCDs', () => {
  let detectCDs;
  let use;
  let tf;

  beforeEach(() => {
    jest.resetModules();

    // Create mock objects
    // Smart mock that simulates basic math operations
    const createMockSqueezedTensor = (val) => ({
      neg: jest.fn(() => createMockSqueezedTensor(-val)),
      add: jest.fn((n) => createMockSqueezedTensor(val + n)),
      dataSync: jest.fn(() => [val]),
      dispose: jest.fn(),
    });

    const mockTensor = {
      squeeze: jest.fn(() => createMockSqueezedTensor(0.9)),
      dispose: jest.fn(),
      data: jest.fn(() => Promise.resolve([0.9])),
    };

    const mockEmbed = jest.fn(() => Promise.resolve(mockTensor));

    // Mock USE
    jest.doMock('@tensorflow-models/universal-sentence-encoder', () => ({
      load: jest.fn(() => Promise.resolve({ embed: mockEmbed })),
    }));

    // Mock TFJS
    jest.doMock('@tensorflow/tfjs', () => {
      const originalTf = jest.requireActual('@tensorflow/tfjs');
      return {
        ...originalTf,
        mean: jest.fn(() => mockTensor),
        metrics: {
          ...originalTf.metrics,
          // Default to low similarity (high negative value? No, small negative value close to 0)
          // cosineProximity returns negative cosine similarity.
          // Low sim = 0.1 -> prox = -0.1.
          // High sim = 0.9 -> prox = -0.9.
          // Let's default to low similarity (-0.1)
          cosineProximity: jest.fn(() => createMockSqueezedTensor(-0.1)),
        },
        tensor2d: jest.fn(() => mockTensor),
      };
    });

    // Re-require modules
    detectCDs = require('./cd-detector').detectCDs;
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity (0.1)
    // cosineProximity returns -0.1.
    // .neg() returns 0.1.
    const lowSim = 0.1;
    const proxVal = -lowSim;

    const createMockSqueezedTensor = (val) => ({
        neg: jest.fn(() => createMockSqueezedTensor(-val)),
        add: jest.fn((n) => createMockSqueezedTensor(val + n)),
        dataSync: jest.fn(() => [val]),
        dispose: jest.fn(),
    });

    tf.metrics.cosineProximity.mockReturnValue(createMockSqueezedTensor(proxVal));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity (0.95)
    // cosineProximity returns -0.95.
    // .neg() returns 0.95.
    const highSim = 0.95;
    const proxVal = -highSim;

    const createMockSqueezedTensor = (val) => ({
        neg: jest.fn(() => createMockSqueezedTensor(-val)),
        add: jest.fn((n) => createMockSqueezedTensor(val + n)),
        dataSync: jest.fn(() => [val]),
        dispose: jest.fn(),
    });

    tf.metrics.cosineProximity.mockReturnValue(createMockSqueezedTensor(proxVal));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('All-or-Nothing');
  });
});
