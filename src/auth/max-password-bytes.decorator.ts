import { ValidateBy } from 'class-validator';

const MAX_BCRYPT_BYTES = 72;

export function MaxPasswordBytes(): PropertyDecorator {
  return ValidateBy({
    name: 'maxPasswordBytes',
    validator: {
      validate(value: unknown): boolean {
        return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= MAX_BCRYPT_BYTES;
      },
      defaultMessage(): string {
        return `La contraseña no debe superar ${MAX_BCRYPT_BYTES} bytes UTF-8`;
      },
    },
  });
}
