/** Remove credential-like and payment patterns before request text enters task state or logs. */
export function redactSensitiveText(input: string): string {
  if (!input) return input;
  return input
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]')
    .replace(/\b(cvv|cvc)\s*[:=]?\s*\d{3,4}\b/gi, '$1: [REDACTED_CVV]')
    .replace(/\b(password|passwd|pwd)\s*[:=]\s*\S+/gi, '$1: [REDACTED_SECRET]')
    .replace(/\b(set-cookie|cookie)\s*[:=]\s*[^\s;,]+/gi, '$1: [REDACTED_COOKIE]')
    .replace(/\b(otp|verification\s+code)\s*[:=]?\s*\d{4,8}\b/gi, '$1: [REDACTED_OTP]')
    .replace(/\badk_local_[a-f0-9]{16,}\b/gi, '[REDACTED_AGENT_TOKEN]')
    .replace(
      /\b(bearer|api[_-]?key|secret[_-]?key|access[_-]?token|token)\s*[:=]\s*[A-Za-z0-9._\-/+=]{8,}\b/gi,
      '$1: [REDACTED_TOKEN]',
    );
}
