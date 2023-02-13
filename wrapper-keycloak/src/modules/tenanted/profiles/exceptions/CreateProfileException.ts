import AbstractException from '../../../../abstract.exception';

export default class CreateProfileException extends AbstractException {
  constructor(message: string) {
    super(message, 400);
  }
}
