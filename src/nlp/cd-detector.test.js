
describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;
  let detectCDs;

  const createMockSqueezedTensor = (val) => ({
    neg: jest.fn(() => createMockSqueezedTensor(-val)),
    add: jest.fn((n) => createMockSqueezedTensor(val + n)),
    dataSync: jest.fn(() => [val]),
    data: jest.fn(() => Promise.resolve([val])),
    dispose: jest.fn(),
  });

  const mockTensor = {
    squeeze: () => createMockSqueezedTensor(0), // Default value doesn't matter much as we mock cosineDistance result
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
        losses: {
          ...originalTf.losses,
          cosineDistance: jest.fn((vec1, vec2, axis) => createMockSqueezedTensor(0.1)), // Default
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
    // If distance is 0.9, similarity is 1 - 0.9 = 0.1
    tf.losses.cosineDistance.mockReturnValue(createMockSqueezedTensor(0.9));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // If distance is 0.05, similarity is 1 - 0.05 = 0.95
    tf.losses.cosineDistance.mockImplementation((vec1, vec2, axis) => {
      return createMockSqueezedTensor(0.05);
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
