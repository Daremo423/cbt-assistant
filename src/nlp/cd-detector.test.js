let detectCDs;

// Mock USE model
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const mockDataResult = [0.9]; // Default high similarity

const mockScoreTensor = {
  data: jest.fn(() => Promise.resolve(mockDataResult)),
  dispose: jest.fn(),
};

const mockTensor = {
  squeeze: jest.fn(() => mockTensor),
  dispose: jest.fn(),
};

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    ready: jest.fn(() => Promise.resolve()),
    tidy: jest.fn((fn) => fn()), // Pass through
    sum: jest.fn(() => mockScoreTensor),
    mul: jest.fn(() => mockTensor),
    mean: jest.fn(() => mockTensor),
    dispose: jest.fn(),
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

    // Reset mocks
    if (tf.sum.mockClear) tf.sum.mockClear();
    if (tf.mul.mockClear) tf.mul.mockClear();
    if (tf.mean.mockClear) tf.mean.mockClear();
    mockScoreTensor.data.mockClear();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity
    mockScoreTensor.data.mockResolvedValue([0.1]);

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text, 'medium');

    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalled();
    expect(mockEmbed).toHaveBeenCalledWith([text]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity
    mockScoreTensor.data.mockResolvedValue([0.9]);

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'low'); // Low sensitivity = high threshold (0.8)

    // Since we mock sum/mul to always return high score, it should detect all types
    // We just check if it contains the one we expect
    expect(result).toContain('All-or-Nothing');
  });
});