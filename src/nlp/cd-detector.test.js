const tf = require('@tensorflow/tfjs');

describe('detectCDs', () => {
  let detectCDs;
  let use;

  beforeEach(() => {
    jest.resetModules();

    // Mock universal-sentence-encoder
    jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
      load: jest.fn(),
    }));
    use = require('@tensorflow-models/universal-sentence-encoder');
  });

  test('should return an empty array if vectors are orthogonal (no similarity)', async () => {
    // Mock embed to return orthogonal vectors
    const mockEmbed = jest.fn((texts) => {
        // Return a valid tensor for any input
        // User input (single string in array) -> Vector A [1, 0, ..., 0]
        if (texts.length === 1 && !Array.isArray(texts[0]) && typeof texts[0] === 'string') {
             const shape = [1, 512];
             const buffer = tf.buffer(shape);
             buffer.set(1, 0, 0); // Set index 0 to 1
             return buffer.toTensor();
        }

        // References (array of strings) -> Vector B [0, 1, ..., 0]
        const shape = [texts.length, 512];
        const buffer = tf.buffer(shape);
        for(let i=0; i<texts.length; i++) {
            buffer.set(1, i, 1); // Set index 1 to 1 for all examples
        }
        return buffer.toTensor();
    });

    use.load.mockResolvedValue({ embed: mockEmbed });

    ({ detectCDs } = require('./cd-detector'));

    const result = await detectCDs('some text');
    expect(result).toEqual([]);
  });

  test('should detect All-or-Nothing if vectors are identical', async () => {
    const mockEmbed = jest.fn((texts) => {
        // User input -> Vector A [1, 0, ..., 0]
        if (texts.length === 1 && !Array.isArray(texts[0]) && typeof texts[0] === 'string') {
             const shape = [1, 512];
             const buffer = tf.buffer(shape);
             buffer.set(1, 0, 0);
             return buffer.toTensor();
        }

        // Identify 'All-or-Nothing' by one of its examples
        if (texts.includes("I always fail at everything.")) {
             // Return Vector A [1, 0, ..., 0] (Same as user input)
             const shape = [texts.length, 512];
             const buffer = tf.buffer(shape);
             for(let i=0; i<texts.length; i++) {
                 buffer.set(1, i, 0);
             }
             return buffer.toTensor();
        }

        // Other distortions -> Vector B [0, 1, ..., 0]
        const shape = [texts.length, 512];
        const buffer = tf.buffer(shape);
        for(let i=0; i<texts.length; i++) {
            buffer.set(1, i, 1);
        }
        return buffer.toTensor();
    });

    use.load.mockResolvedValue({ embed: mockEmbed });

    ({ detectCDs } = require('./cd-detector'));

    const result = await detectCDs('some text', 'medium');
    expect(result).toContain('All-or-Nothing');
    expect(result).not.toContain('Labeling');
  });
});
