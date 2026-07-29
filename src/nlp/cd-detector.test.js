
const mockEmbedFunction = jest.fn(() => {
    // Return a tensor-like object synchronously for await to resolve with
    return Promise.resolve({
        squeeze: jest.fn(() => ({
            dispose: jest.fn(),
            dataSync: jest.fn(() => [0.1]),
        })),
        dispose: jest.fn(),
        dataSync: jest.fn(() => [0.1]),
    });
});

jest.mock('@tensorflow-models/universal-sentence-encoder', () => {
  return {
    load: jest.fn(() => Promise.resolve({
      embed: mockEmbedFunction,
    })),
  };
});

const mockTensor = {
  dataSync: jest.fn(() => [0.9]),
  dispose: jest.fn(),
  squeeze: jest.fn(() => mockTensor),
};

jest.mock('@tensorflow/tfjs', () => {
  return {
    tidy: jest.fn((callback) => callback()),
    mul: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockTensor),
    mean: jest.fn(() => mockTensor),
    tensor2d: jest.fn(() => mockTensor),
  };
});

let detectCDs;
let tf;

describe('detectCDs', () => {
  beforeEach(() => {
    jest.resetModules();
    tf = require('@tensorflow/tfjs');

    // Reset mocks
    mockEmbedFunction.mockClear();
    tf.sum.mockClear();

    ({ detectCDs } = require('./cd-detector'));
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Mock sum to return a tensor with low similarity
    const lowSimTensor = {
      dataSync: jest.fn(() => [0.1]),
      dispose: jest.fn(),
    };
    tf.sum.mockReturnValue(lowSimTensor);

    // Ensure embed returns a promise that resolves to an object with squeeze
    mockEmbedFunction.mockResolvedValue({
        squeeze: jest.fn(() => ({ dispose: jest.fn() })),
        dispose: jest.fn(),
        dataSync: jest.fn(() => [0.1]),
    });

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);

    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock sum to return a tensor with high similarity
    const highSimTensor = {
      dataSync: jest.fn(() => [0.95]),
      dispose: jest.fn(),
    };
    tf.sum.mockReturnValue(highSimTensor);

    mockEmbedFunction.mockResolvedValue({
        squeeze: jest.fn(() => ({ dispose: jest.fn() })),
        dispose: jest.fn(),
        dataSync: jest.fn(() => [0.1]),
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('All-or-Nothing');
  });
});
