
let detectCDs;
let tf;
let use;
let mockModel;

// Define helper for test expectations
const createMockTensor = (dataSyncValue = [0.5]) => {
  const tensor = {
    dataSync: jest.fn(() => dataSyncValue),
    dispose: jest.fn(),
    squeeze: jest.fn(() => createMockTensor(dataSyncValue)),
    div: jest.fn(() => createMockTensor(dataSyncValue)),
    mul: jest.fn(() => createMockTensor(dataSyncValue)),
    sub: jest.fn(() => createMockTensor(dataSyncValue)),
    norm: jest.fn(() => createMockTensor(dataSyncValue)),
    sum: jest.fn(() => createMockTensor(dataSyncValue)),
    mean: jest.fn(() => createMockTensor(dataSyncValue)),
  };
  return tensor;
};

describe('detectCDs', () => {
  beforeEach(() => {
    jest.resetModules(); // MUST be first

    // Define mocks using doMock to ensure they are used by the freshly required modules
    jest.doMock('@tensorflow-models/universal-sentence-encoder', () => ({
      load: jest.fn(),
    }));

    jest.doMock('@tensorflow/tfjs', () => {
        // Define factory locally to avoid scope issues
        const mockTensorFactory = (dataSyncValue = [0.5]) => {
            return {
              dataSync: jest.fn(() => dataSyncValue),
              dispose: jest.fn(),
              squeeze: jest.fn(() => mockTensorFactory(dataSyncValue)),
              div: jest.fn(() => mockTensorFactory(dataSyncValue)),
              mul: jest.fn(() => mockTensorFactory(dataSyncValue)),
              sub: jest.fn(() => mockTensorFactory(dataSyncValue)),
              norm: jest.fn(() => mockTensorFactory(dataSyncValue)),
              sum: jest.fn(() => mockTensorFactory(dataSyncValue)),
              mean: jest.fn(() => mockTensorFactory(dataSyncValue)),
            };
        };

        const tfMock = {
            tidy: jest.fn((fn) => fn()),
            mean: jest.fn(() => mockTensorFactory()),
            embed: jest.fn(),
            sum: jest.fn(() => mockTensorFactory()),
            mul: jest.fn(() => mockTensorFactory()),
            norm: jest.fn(() => mockTensorFactory()),
            tensor1d: jest.fn(() => mockTensorFactory()),
            tensor2d: jest.fn(() => mockTensorFactory()),
        };

        return {
            __esModule: true,
            ...tfMock,
            default: tfMock,
        };
    });

    // Re-require modules
    tf = require('@tensorflow/tfjs');
    use = require('@tensorflow-models/universal-sentence-encoder');
    const detectorModule = require('./cd-detector');
    detectCDs = detectorModule.detectCDs;

    // Setup Mock Model
    mockModel = {
      embed: jest.fn().mockResolvedValue(createMockTensor()),
    };
    use.load.mockResolvedValue(mockModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return an empty array if no cognitive distortions are detected', async () => {
    const lowSimTensor = createMockTensor([0.1]);

    // Override implementation on the FRESH mock object
    // We use the default export object if that's what was returned
    const targetTf = tf.default || tf;

    targetTf.sum.mockReturnValue({
      ...createMockTensor(),
      div: jest.fn(() => lowSimTensor)
    });

    const text = 'This is a neutral sentence.';
    const result = await detectCDs(text);

    expect(result).toEqual([]);
    expect(use.load).toHaveBeenCalled();
    expect(mockModel.embed).toHaveBeenCalledWith([text]);
  });

  test('should detect "All-or-Nothing" distortion', async () => {
    const highSimTensor = createMockTensor([0.9]);
    const targetTf = tf.default || tf;

    targetTf.sum.mockReturnValue({
      ...createMockTensor(),
      div: jest.fn(() => highSimTensor)
    });

    const text = 'I always fail at everything.';
    const result = await detectCDs(text, 'medium');

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('All-or-Nothing');
  });
});
