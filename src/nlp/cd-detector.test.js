let detectCDs;

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn(),
}));

jest.mock('@tensorflow/tfjs', () => {
  const originalTf = jest.requireActual('@tensorflow/tfjs');
  return {
    ...originalTf,
    tidy: jest.fn((fn) => fn()),
    losses: {
      ...originalTf.losses,
      cosineDistance: jest.fn(),
    },
    mean: jest.fn(),
  };
});

const createMockTensor = (initialValue = 0) => {
  let currentValue = initialValue;
  const tensor = {
    neg: jest.fn(() => {
      currentValue = -currentValue;
      return tensor;
    }),
    add: jest.fn((val) => {
      currentValue = currentValue + val;
      return tensor;
    }),
    dataSync: jest.fn(() => [currentValue]),
    data: jest.fn(() => Promise.resolve([currentValue])),
    dispose: jest.fn(),
    squeeze: jest.fn(() => tensor),
  };
  return tensor;
};

describe('detectCDs', () => {
  let mockEmbed;
  let use;
  let tf;
  let mockEmbedTensor;
  let mockMeanTensor;

  beforeEach(() => {
    jest.resetModules();
    use = require('@tensorflow-models/universal-sentence-encoder');
    tf = require('@tensorflow/tfjs');
    ({ detectCDs } = require('./cd-detector'));

    mockEmbedTensor = createMockTensor(0);
    mockEmbedTensor.squeeze.mockImplementation(() => createMockTensor(0));

    mockEmbed = jest.fn(() => Promise.resolve(mockEmbedTensor));
    use.load.mockResolvedValue({ embed: mockEmbed });

    mockMeanTensor = createMockTensor(0);
    tf.mean.mockImplementation(() => mockMeanTensor);

    tf.losses.cosineDistance.mockImplementation(() => createMockTensor(0.1)); // default sim = 0.9
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    // distance = 0.9 => similarity = 0.1
    tf.losses.cosineDistance.mockImplementation(() => createMockTensor(0.9));
    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);
    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    // distance = 0.05 => similarity = 0.95
    tf.losses.cosineDistance.mockImplementation((vec1, vec2) => {
      return createMockTensor(0.05);
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'high');
    expect(result).toContain('All-or-Nothing');
    expect(use.load).toHaveBeenCalledTimes(1);
    expect(mockEmbed).toHaveBeenCalled();
  });
});
