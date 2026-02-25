import * as tf from '@tensorflow/tfjs';
// We don't need top-level import for use if we require it inside tests
// import * as use from '@tensorflow-models/universal-sentence-encoder';

// Mock dependencies
jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    tidy: jest.fn((fn) => fn()),
    dispose: jest.fn(),
    mean: jest.fn().mockReturnValue({
        dispose: jest.fn(),
        reshape: jest.fn().mockReturnThis()
    }),
    losses: {
        cosineDistance: jest.fn().mockReturnValue({
            neg: jest.fn().mockReturnValue({
                add: jest.fn().mockReturnValue({
                    dataSync: jest.fn().mockReturnValue([0.9]) // Similarity 0.9 (High)
                })
            })
        })
    }
  };
});

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

describe('CD Detector', () => {
  let mockModel;
  let detectCDs;
  // eslint-disable-next-line no-unused-vars
  let loadModel;
  let useModule;

  beforeEach(() => {
    jest.resetModules(); // Reset module registry - important for singleton 'model'
    jest.clearAllMocks();

    mockModel = {
      embed: jest.fn().mockResolvedValue({
        dispose: jest.fn(),
        reshape: jest.fn().mockReturnThis(),
        squeeze: jest.fn().mockReturnThis(),
        dataSync: jest.fn().mockReturnValue([1, 2]),
      }),
    };

    useModule = require('@tensorflow-models/universal-sentence-encoder');
    useModule.load.mockResolvedValue(mockModel);

    // We need to re-require the module under test
    const cdDetector = require('./cd-detector');
    detectCDs = cdDetector.detectCDs;
    loadModel = cdDetector.loadModel;
  });

  test('detectCDs loads model if not loaded', async () => {
    await detectCDs('test text');
    expect(useModule.load).toHaveBeenCalled();
  });

  test('detectCDs detects distortions based on high similarity', async () => {
    const result = await detectCDs('I am a loser', 'medium');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Labeling');
  });
});
