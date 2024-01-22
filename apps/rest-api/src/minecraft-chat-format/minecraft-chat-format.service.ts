import { Injectable } from '@nestjs/common';
import { StringComponent } from './components';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { StringComponentIsNotValidException } from './exceptions/string-component-is-not-valid.exception';

@Injectable()
export class MinecraftChatFormatService {
  getLengthOfComponent(component: StringComponent): number {
    let length = 0;

    length += component.text.length;

    if (component.extra) {
      for (const stringComponent of component.extra) {
        length += this.getLengthOfComponent(stringComponent);
      }
    }

    return length;
  }

  async validateComponent(
    component: StringComponent | string,
    maxLength?: number,
  ): Promise<void> {
    let stringComponent: StringComponent;

    if (typeof component === 'string') {
      try {
        stringComponent = this.parseComponent(JSON.parse(component));
      } catch (e) {
        throw new StringComponentIsNotValidException();
      }
    } else {
      stringComponent = component;
    }

    if (!stringComponent) {
      throw new StringComponentIsNotValidException();
    }

    const result = await validate(stringComponent);

    if (result.length !== 0) throw new StringComponentIsNotValidException();

    if (maxLength !== undefined) {
      if (this.getLengthOfComponent(stringComponent) > maxLength) {
        throw new StringComponentIsNotValidException();
      }
    }
  }

  parseComponent(component: unknown): StringComponent {
    return plainToInstance(StringComponent, component);
  }
}
