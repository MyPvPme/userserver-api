import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'NoSlash', async: false })
export class NoSlashValidator implements ValidatorConstraintInterface {
  defaultMessage(): string {
    return 'The value ($value) contains a slash';
  }

  validate(value: string): boolean {
    return !value.includes('/');
  }
}
