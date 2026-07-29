
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

// We need to use require to get the function after resetModules?
// The previous test file used require inside beforeEach. I should stick to that if possible
// or just use standard jest mocks if I don't need resetModules for module state.
// cd-detector.js has module-level state (model, cdReferenceEmbeddings).
// So I DO need resetModules.

jest.mock('@tensorflow-models/universal-sentence-encoder');
jest.mock('@tensorflow/tfjs');

describe('detectCDs', () => {
  let detectCDs;
  let use;
  let tf;
  let mockEmbed;
  let mockTensor;

  beforeEach(() => {
    jest.resetModules();

    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    // Setup mocks
    mockTensor = {
        squeeze: jest.fn().mockReturnThis(),
        dispose: jest.fn(),
        data: jest.fn().mockResolvedValue([0.9])
    };

    // tf methods
    tf.tidy = jest.fn((fn) => fn());
    tf.mean = jest.fn().mockReturnValue(mockTensor);
    tf.sum = jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.9]),
        dispose: jest.fn()
    });
    tf.mul = jest.fn().mockReturnValue(mockTensor);

    mockEmbed = jest.fn().mockResolvedValue(mockTensor);
    use.load.mockResolvedValue({ embed: mockEmbed });

    ({ detectCDs } = require('./cd-detector'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // Override tf.sum to return low score
    tf.sum.mockReturnValue({
        data: jest.fn().mockResolvedValue([0.1]),
        dispose: jest.fn()
    });

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
  });

  test('should detect distortions when score is high', async () => {
    // Default mock returns 0.9, which is > 0.8 (low sensitivity threshold)
    // and > 0.7 (medium) and > 0.6 (high)

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium');

    // It should detect all defined types because we return high score for everything
    expect(result).toContain('All-or-Nothing');
    expect(result.length).toBeGreaterThan(0);
  });
});
