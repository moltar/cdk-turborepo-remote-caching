import * as jwt from './jwt';

const secret = '0123456789012345678901234567890123456789';

describe('JWT', () => {
  it('should be able to sign', async () => {
    expect.assertions(2);

    const signed = await jwt.sign(secret);

    expect(signed).toBeDefined();
    expect(typeof signed).toBe('string');
  });

  it('should be able to verify', async () => {
    expect.assertions(2);

    const signed = await jwt.sign(secret);
    const verified = await jwt.verify(secret, signed);

    expect(verified).toBeDefined();
    expect(typeof verified).toBe('object');
  });

  it('should fail to verify when JWT is invalid', async () => {
    expect.assertions(1);

    await expect(() => jwt.verify(secret, 'xyz')).rejects.toThrowError();
  });
});