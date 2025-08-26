import fc from 'fast-check';

test('string contains itself', () => {
    fc.assert(
        fc.property(fc.string(), (text) => text.includes(text))
    );
});
test('addition is commutative', () => {
    fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),//fails intentionally to check
        { numRuns: 100,verbose: true }
    );
});
test('dummy test', () => {
    expect(true).toBe(true);
});
