import { detectCDs } from './cd-detector';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

jest.mock('@tensorflow-models/universal-sentence-encoder');

describe('Cognitive Distortion Detector', () => {
  beforeAll(() => {
     jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should detect distortions correctly using mocked embeddings', async () => {
    // Mock the model
    const mockModel = {
      embed: jest.fn().mockImplementation((text) => {
          if (Array.isArray(text) && text.length > 1) {
              // Reference generation: return batch of embeddings
              // Shape: [num_examples, 2]
              // All vectors are [1, 0]
              const values = new Array(text.length).fill([1, 0]);
              return Promise.resolve(tf.tensor2d(values));
          } else {
              // User input: return single embedding
              // Shape: [1, 2]
              return Promise.resolve(tf.tensor2d([[1, 0]]));
          }
      }),
    };

    use.load.mockResolvedValue(mockModel);

    // Call detectCDs
    // Since input [1,0] aligns perfectly with reference [1,0], similarity should be 1.0
    // Threshold for 'medium' is 0.7.
    const result = await detectCDs('Test input', 'medium');

    expect(use.load).toHaveBeenCalled();
    expect(mockModel.embed).toHaveBeenCalled();

    // Check that we found distortions
    // (Should find all of them since we mocked all references to be identical to input)
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('All-or-Nothing');
    expect(result).toContain('Should Statements');
    expect(result).toContain('Labeling');
    expect(result).toContain('Catastrophizing');
  });

  it('should not detect distortions when similarity is low', async () => {
     // Reset mocks to return orthogonal vectors
     const mockModel = {
      embed: jest.fn().mockImplementation((text) => {
          if (Array.isArray(text) && text.length > 1) {
              // References are [1, 0]
              const values = new Array(text.length).fill([1, 0]);
              return Promise.resolve(tf.tensor2d(values));
          } else {
              // Input is [0, 1] (orthogonal)
              return Promise.resolve(tf.tensor2d([[0, 1]]));
          }
      }),
    };
    use.load.mockResolvedValue(mockModel);

    // We need to reload the model or reset the module state if possible.
    // However, cd-detector.js has module-level `model` variable.
    // Jest `resetModules` is needed to reload the module and clear the singleton `model`.
    jest.resetModules();
    const { detectCDs: detectCDsFresh } = require('./cd-detector');

    // Re-mock use.load because resetModules clears mocks on require?
    // No, jest.mock is hoisted. But require will use the factory again.
    // Wait, jest.mock factory is executed. But return value configuration is lost?
    // Let's re-configure the mock.
    const useFresh = require('@tensorflow-models/universal-sentence-encoder');
    useFresh.load.mockResolvedValue(mockModel);

    const result = await detectCDsFresh('Test input', 'medium');

    // Similarity between [1, 0] and [0, 1] is 0.
    // Threshold is 0.7. 0 < 0.7.
    expect(result.length).toBe(0);
  });
});
