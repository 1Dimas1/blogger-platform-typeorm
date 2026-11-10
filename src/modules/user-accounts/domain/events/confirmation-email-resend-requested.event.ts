export class ConfirmationEmailResendRequestedEvent {
  constructor(
    public readonly email: string,
    public confirmationCode: string,
  ) {}
}
