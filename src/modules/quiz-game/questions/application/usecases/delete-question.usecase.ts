import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class DeleteQuestionCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand, void>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ id }: DeleteQuestionCommand): Promise<void> {
    const question = await this.questionsRepository.findOrNotFoundFail(id);

    await this.questionsRepository.softDelete(question);
  }
}
