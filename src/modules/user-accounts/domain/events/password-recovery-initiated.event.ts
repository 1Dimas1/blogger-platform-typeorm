export class PasswordRecoveryInitiatedEvent {
  constructor(
    public readonly email: string,
    public recoveryCode: string,
  ) {}
}
