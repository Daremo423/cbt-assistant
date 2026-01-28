import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

let mockSimilarityValue = 0.9;

const createMockSqueezedTensor = (val) => {
  const value = val !== undefined ? val : mockSimilarityValue;
  return {
    neg: jest.fn(() => createMockSqueezedTensor(value)),
    add: jest.fn(() => createMockSqueezedTensor(value)),
    mul: jest.fn(() => createMockSqueezedTensor(value)),
    div: jest.fn(() => createMockSqueezedTensor(value)),
    dataSync: jest.fn(() => [value]),
    dispose: jest.fn(),
  };
};

const mockTensor = {
  squeeze: jest.fn(() => createMockSqueezedTensor()),
  dispose: jest.fn(),
  mul: jest.fn(() => createMockSqueezedTensor()),
};

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensor), // Always return mockTensor
    mul: jest.fn(() => createMockSqueezedTensor()),
    sum: jest.fn(() => createMockSqueezedTensor()),
    norm: jest.fn(() => createMockSqueezedTensor(1.0)),
    tidy: jest.fn((fn) => fn()),
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
  let detectCDs;

  beforeEach(() => {
    jest.resetModules();

    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    // We need to require the module under test AFTER resetting modules and setting up mocks?
    // Mocks are hoisted, but mockResolvedValue needs to be set.

    mockEmbed = jest.fn(() => Promise.resolve(mockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });

    // Require module under test
    ({ detectCDs } = require('./cd-detector'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity for all CDs
    mockSimilarityValue = 0.1;
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Mock cosineDistance to return high similarity
    mockSimilarityValue = 0.95;

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'low'); // 'low' sensitivity needs high threshold (0.8)
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
