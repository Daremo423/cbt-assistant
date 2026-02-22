
describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;
  let detectCDs;

  const createMockSqueezedTensor = (similarityValue = 0.9) => ({
    neg: jest.fn(() => createMockSqueezedTensor(similarityValue)),
    add: jest.fn(() => createMockSqueezedTensor(similarityValue)),
    dataSync: jest.fn(() => [similarityValue]),
    data: jest.fn(() => Promise.resolve([similarityValue])),
    dispose: jest.fn(),
  });

  const mockTensor = {
    squeeze: () => createMockSqueezedTensor(),
    dispose: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();

    jest.doMock('@tensorflow-models/universal-sentence-encoder', () => ({
      load: jest.fn(),
    }));

    jest.doMock('@tensorflow/tfjs', () => {
      const originalTf = jest.requireActual('@tensorflow/tfjs');
      return {
        ...originalTf,
        mean: jest.fn((tensor) => mockTensor),
        metrics: {
          ...originalTf.metrics,
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

    ({ detectCDs } = require('./cd-detector'));
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');

    mockEmbed = jest.fn(() => Promise.resolve(mockTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    tf.metrics.cosineDistance.mockReturnValue(createMockSqueezedTensor(0.1));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    tf.metrics.cosineDistance.mockImplementation((vec1, vec2) => {
      return createMockSqueezedTensor(0.95);
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
