import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class PublishQuestionCommand {
  constructor(
    public id: string,
    public published: boolean,
  ) {}
}

@CommandHandler(PublishQuestionCommand)
export class PublishQuestionUseCase
  implements ICommandHandler<PublishQuestionCommand, void>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ id, published }: PublishQuestionCommand): Promise<void> {
    const question = await this.questionsRepository.findOrNotFoundFail(id);

    question.setPublished(published);

    await this.questionsRepository.save(question);
  }
}
