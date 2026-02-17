
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => {
  const mockTensor = {
    data: jest.fn(() => Promise.resolve([0.9])),
    dataSync: jest.fn(() => [0.9]),
    dispose: jest.fn(),
    squeeze: jest.fn(function() { return this; }),
  };

  return {
    tidy: jest.fn((fn) => fn()),
    mean: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor),
    tensor2d: jest.fn(() => mockTensor),
  };
});

describe('detectCDs', () => {
  let detectCDs;
  let use;
  let tf;

  beforeEach(() => {
    jest.resetModules();
    detectCDs = require('./cd-detector').detectCDs;
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    const mockEmbed = jest.fn(() => Promise.resolve({
        squeeze: jest.fn(() => ({ dispose: jest.fn() })),
        dispose: jest.fn(),
    }));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Mock sum to return low similarity
    const mockLowScoreTensor = {
        data: jest.fn(() => Promise.resolve([0.1])),
        dispose: jest.fn(),
    };
    tf.sum.mockReturnValue(mockLowScoreTensor);

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock sum to return high similarity
    const mockHighScoreTensor = {
        data: jest.fn(() => Promise.resolve([0.95])),
        dispose: jest.fn(),
    };
    tf.sum.mockReturnValue(mockHighScoreTensor);

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
  });
});
