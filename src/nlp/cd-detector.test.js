// src/nlp/cd-detector.test.js
import { detectCDs } from './cd-detector';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

const createMockSqueezedTensor = (similarityValue = 0.9) => ({
  neg: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  add: jest.fn(() => createMockSqueezedTensor(similarityValue)),
  dataSync: jest.fn(() => [similarityValue]),
  data: jest.fn(() => Promise.resolve([similarityValue])),
  dispose: jest.fn(),
});

const mockTensor = {
  squeeze: jest.fn(() => createMockSqueezedTensor()),
  dispose: jest.fn(),
};

// Define mockEmbed once to ensure stable reference across tests since 'model' singleton persists
const mockEmbed = jest.fn();

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    mean: jest.fn((tensor) => mockTensor),
    losses: {
      cosineDistance: jest.fn((vec1, vec2) => createMockSqueezedTensor(0.9)),
    },
    tensor2d: jest.fn(() => mockTensor),
    equal: jest.fn(() => ({
      all: jest.fn(() => ({
        dataSync: jest.fn(() => [1]),
      })),
    })),
  };
});

describe('detectCDs', () => {
  beforeEach(() => {
    // Jest's resetMocks: true (often default in CRA) might clear mock implementations.
    // Explicitly restore the implementation for every test.
    mockEmbed.mockImplementation(() => Promise.resolve(mockTensor));

    jest.clearAllMocks();
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    tf.losses.cosineDistance.mockReturnValue(createMockSqueezedTensor(0.1));

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    tf.losses.cosineDistance.mockReturnValue(createMockSqueezedTensor(0.95));

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
  });
});
