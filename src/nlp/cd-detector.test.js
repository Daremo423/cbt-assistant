let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

// Mock tensor that allows chaining and dataSync
const createMockTensor = (data = [0]) => ({
  dataSync: jest.fn(() => data),
  dispose: jest.fn(),
  squeeze: jest.fn(() => createMockTensor(data)),
});

const mockTensor = createMockTensor();

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor), // Mock mul
    sum: jest.fn(() => mockTensor), // Mock sum
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
    // Simulate low similarity (0.1)
    tf.sum.mockReturnValue(createMockTensor([0.1]));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity (0.9)
    tf.sum.mockReturnValue(createMockTensor([0.9]));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high'); // high sensitivity (threshold 0.6) -> 0.9 > 0.6

    // Since we mock sum to always return 0.9, it will detect ALL defined distortions
    // We expect 'All-or-Nothing' to be in the list
    expect(result).toContain('All-or-Nothing');
  });
});
