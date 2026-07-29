let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

// Mock for the final result tensor of cosineSimilarity
const createMockResultTensor = (similarityValue = 0.9) => ({
  dataSync: jest.fn(() => [similarityValue]),
  dispose: jest.fn(),
});

// Mock object that acts as a scalar/tensor result for intermediate operations
const mockScalarObj = {
  mul: jest.fn(),
  div: jest.fn(),
};
// Setup chainable returns
mockScalarObj.mul.mockReturnValue(mockScalarObj);
mockScalarObj.div.mockReturnValue(createMockResultTensor(0.9));

const mockTensor = {
  squeeze: jest.fn(() => mockScalarObj),
  dispose: jest.fn(),
};

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensor),
    tidy: jest.fn((fn) => fn()),
    mul: jest.fn(() => mockScalarObj),
    sum: jest.fn(() => mockScalarObj),
    norm: jest.fn(() => mockScalarObj),
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

    // Default high similarity
    mockScalarObj.div.mockReturnValue(createMockResultTensor(0.9));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Simulate low similarity
    mockScalarObj.div.mockReturnValue(createMockResultTensor(0.1));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // Simulate high similarity
    mockScalarObj.div.mockReturnValue(createMockResultTensor(0.95));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium');
    expect(result).toContain('All-or-Nothing');
  });
});
