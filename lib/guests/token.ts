import { customAlphabet } from 'nanoid';

// 12-char nanoid with unambiguous alphabet (no 0, O, o, 1, l, I)
const UNAMBIGUOUS_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const generateNanoid = customAlphabet(UNAMBIGUOUS_ALPHABET, 12);

export function generateGuestToken(): string {
  return generateNanoid();
}
