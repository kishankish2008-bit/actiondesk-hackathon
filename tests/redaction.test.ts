import { describe, it, expect } from 'vitest';
import { redactSensitiveText } from '../server/src/policy/redaction.js';

describe('Sensitive input redaction', () => {
  it('removes card-like values, passwords, OTPs, and API secrets before storing request text', () => {
    const clean = redactSensitiveText(
      'password=hunter2 OTP: 482910 card 4111 1111 1111 1111 api_key=AbCdEfGh1234',
    );
    expect(clean).not.toContain('hunter2');
    expect(clean).not.toContain('482910');
    expect(clean).not.toContain('4111 1111 1111 1111');
    expect(clean).not.toContain('AbCdEfGh1234');
  });

  it('returns ordinary request content unchanged', () => {
    expect(redactSensitiveText('Find headphones under ₹5,000')).toBe(
      'Find headphones under ₹5,000',
    );
  });
});
