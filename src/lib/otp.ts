const OTP_TTL_MS = 10 * 60 * 1000;

type PendingOtp = {
  code: string;
  createdAt: number;
  expiresAt: number;
};

type OtpStore = Map<string, PendingOtp>;

const otpStore = ((globalThis as typeof globalThis & {
  __cavitiOtpStore?: OtpStore;
}).__cavitiOtpStore ??= new Map<string, PendingOtp>());

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOtp(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  otpStore.set(normalizedEmail, {
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL_MS,
  });
}

export function consumeOtp(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = otpStore.get(normalizedEmail);

  if (!pending) {
    return false;
  }

  if (Date.now() > pending.expiresAt) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  if (pending.code !== code) {
    return false;
  }

  otpStore.delete(normalizedEmail);
  return true;
}
