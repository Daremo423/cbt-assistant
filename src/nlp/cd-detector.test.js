let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockTensor = (value = 0.9) => ({
  dataSync: jest.fn(() => [value]),
  dispose: jest.fn(),
  squeeze: jest.fn(() => createMockTensor(value)),
});

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn(() => createMockTensor()),
    sum: jest.fn(),
    mul: jest.fn(),
    tensor2d: jest.fn(() => createMockTensor()),
    ready: jest.fn(() => Promise.resolve()),
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

    mockEmbed = jest.fn(() => Promise.resolve(createMockTensor()));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity for all CDs
    tf.mul.mockReturnValue(createMockTensor());
    tf.sum.mockReturnValue(createMockTensor(0.1)); // 0.1 similarity

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock sum to return high similarity
    tf.mul.mockReturnValue(createMockTensor());
    tf.sum.mockReturnValue(createMockTensor(0.95)); // 0.95 similarity

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
