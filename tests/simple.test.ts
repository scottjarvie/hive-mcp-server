// A simple test to verify Jest is working correctly

describe('Simple test', () => {
  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect('Hello').toContain('Hell');
  });

  it('should handle async code', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
