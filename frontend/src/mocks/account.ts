let mockCurrentPassword = "qwerty";
const MOCK_EMAIL_VERIFICATION_CODE = "123456";

export function verifyMockCurrentPassword(password: string): boolean {
  return password === mockCurrentPassword;
}

export function sendMockEmailVerificationCode(email: string): void {
  console.log(
    `[mock email] Verification code sent to ${email}: ${MOCK_EMAIL_VERIFICATION_CODE}`,
  );
}

export function verifyMockEmailVerificationCode(code: string): boolean {
  return code === MOCK_EMAIL_VERIFICATION_CODE;
}

export function sendMockEmailChangeNotification(
  oldEmail: string,
  newEmail: string,
): void {
  console.log(
    `[mock email] Security notification sent to ${oldEmail}: email changed to ${newEmail}`,
  );
}

const MOCK_PHONE_VERIFICATION_CODE = "1234";

export function sendMockPhoneVerificationCode(phone: string): void {
  console.log(
    `[mock SMS] Verification code sent to ${phone}: ${MOCK_PHONE_VERIFICATION_CODE}`,
  );
}

export function verifyMockPhoneVerificationCode(code: string): boolean {
  return code === MOCK_PHONE_VERIFICATION_CODE;
}

export function sendMockPhoneChangeNotification(
  email: string,
  oldPhone: string,
  newPhone: string,
): void {
  console.log(
    `[mock email] Security notification sent to ${email}: phone changed from ${oldPhone} to ${newPhone}`,
  );
}

export function updateMockCurrentPassword(newPassword: string): void {
  mockCurrentPassword = newPassword;
}

export function sendMockPasswordChangeNotification(email: string): void {
  console.log(
    `[mock email] Security notification sent to ${email}: password was changed`,
  );
}

const MOCK_PASSWORD_RECOVERY_CODE = "654321";

export function sendMockPasswordRecoveryCode(email: string): void {
  console.log(
    `[mock email] Password recovery code sent to ${email}: ${MOCK_PASSWORD_RECOVERY_CODE}`,
  );
}

export function verifyMockPasswordRecoveryCode(code: string): boolean {
  return code === MOCK_PASSWORD_RECOVERY_CODE;
}

export function sendMockPasswordResetNotification(email: string): void {
  console.log(
    `[mock email] Security notification sent to ${email}: password was reset`,
  );
}
