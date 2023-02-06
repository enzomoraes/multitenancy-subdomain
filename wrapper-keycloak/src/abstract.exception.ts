export default class AbstractException {
  constructor(private message: string, private statusCode: number) {}
}
