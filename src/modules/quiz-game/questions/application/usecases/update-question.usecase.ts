import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateQuestionDto } from '../../dto/update-question.dto';
import { QuestionsRepository } from '../../infrastructure/questions.repository';

export class UpdateQuestionCommand {
  constructor(
    public id: string,
    public dto: UpdateQuestionDto,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand, void>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ id, dto }: UpdateQuestionCommand): Promise<void> {
    const question = await this.questionsRepository.findOrNotFoundFail(id);

    question.update(dto);

    await this.questionsRepository.save(question);
  }
}
