export function maskPhone(phoneNumber: string) {
  if (phoneNumber.length < 4) return phoneNumber;

  const first = phoneNumber.slice(0, 3);
  const last = phoneNumber.slice(-2);

  return `${first}*****${last}`;
}
