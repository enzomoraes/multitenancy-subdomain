import AbstractException from '../../../../abstract.exception';

export default class CreateTenantException extends AbstractException {
  constructor(message: string) {
    super(message, 400);
  }
}
