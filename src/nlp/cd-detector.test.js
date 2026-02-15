let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockTensor = (data = [0.9]) => ({
  dataSync: jest.fn(() => data),
  dispose: jest.fn(),
  squeeze: jest.fn(() => createMockTensor(data)),
  add: jest.fn(() => createMockTensor(data)),
  div: jest.fn(() => createMockTensor(data)),
  mul: jest.fn(() => createMockTensor(data)),
  sum: jest.fn(() => createMockTensor(data)),
});

const mockTensor = createMockTensor();

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn(() => mockTensor),
    sum: jest.fn((t) => t), // Pass through for sum
    mul: jest.fn(() => mockTensor), // Return mock tensor for mul
    tidy: jest.fn((fn) => fn()), // Execute callback immediately
    tensor2d: jest.fn(() => mockTensor),
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
    // We mock sum to return a tensor with a low value when called during cosineSimilarity
    const lowValTensor = createMockTensor([0.1]);
    tf.sum.mockReturnValue(lowValTensor);

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity
    const highValTensor = createMockTensor([0.95]);
    tf.sum.mockReturnValue(highValTensor);

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
