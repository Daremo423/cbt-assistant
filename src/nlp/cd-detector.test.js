import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow-models/universal-sentence-encoder');

jest.mock('@tensorflow/tfjs', () => {
  const mockTensor = {
      data: jest.fn(),
      dispose: jest.fn(),
      squeeze: jest.fn(),
      div: jest.fn(),
      mul: jest.fn(),
      sub: jest.fn(),
      square: jest.fn(),
      sqrt: jest.fn(),
      mean: jest.fn(),
  };
  mockTensor.squeeze.mockReturnValue(mockTensor);
  mockTensor.div.mockReturnValue(mockTensor);
  mockTensor.mul.mockReturnValue(mockTensor);
  mockTensor.sub.mockReturnValue(mockTensor);
  mockTensor.square.mockReturnValue(mockTensor);
  mockTensor.sqrt.mockReturnValue(mockTensor);

  return {
    __mockTensor: mockTensor, // Helper to access the mock tensor instance in tests
    tidy: jest.fn((fn) => fn()),
    mean: jest.fn(() => mockTensor),
    sum: jest.fn(() => mockTensor),
    mul: jest.fn(() => mockTensor),
    sub: jest.fn(() => mockTensor),
    square: jest.fn(() => mockTensor),
    sqrt: jest.fn(() => mockTensor),
    div: jest.fn(() => mockTensor),
  };
});

describe('detectCDs', () => {
  let mockModel;
  let mockTensor;
  let detectCDs;
  let use;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    use = require('@tensorflow-models/universal-sentence-encoder');
    const tfModule = require('@tensorflow/tfjs');

    mockTensor = tfModule.__mockTensor;
    mockTensor.data.mockResolvedValue([0.9]); // Default high score

    // Mock USE model
    mockModel = {
      embed: jest.fn().mockResolvedValue(mockTensor),
    };
    use.load.mockResolvedValue(mockModel);

    // Import the module under test
    detectCDs = require('./cd-detector').detectCDs;
  });

  test('should detect distortions when similarity is high', async () => {
    const result = await detectCDs('I am a failure', 'medium');
    expect(result.length).toBeGreaterThan(0);
    expect(use.load).toHaveBeenCalled();
  });

  test('should not detect distortions when similarity is low', async () => {
    mockTensor.data.mockResolvedValue([0.1]);
    const result = await detectCDs('I am happy', 'medium');
    expect(result).toEqual([]);
  });
});
