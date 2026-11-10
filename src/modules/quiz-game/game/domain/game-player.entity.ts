import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Answer } from './answer.entity';
import { User } from '../../../user-accounts/domain/user.entity';

// a user's participation in one game: position 1 created the pair, 2 joined it
@Entity('game_players')
@Index('idx_game_players_game_position_unique', ['gameId', 'position'], {
  unique: true,
})
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.players, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'uuid' })
  gameId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'smallint' })
  position: number;

  @Column({ type: 'integer', default: 0 })
  score: number;

  // when the player answered the last question
  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @OneToMany(() => Answer, (answer) => answer.player, { cascade: true })
  answers: Answer[];

  static createInstance(userId: string, position: number): GamePlayer {
    const player = new GamePlayer();
    player.userId = userId;
    player.position = position;
    player.score = 0;
    player.finishedAt = null;
    player.answers = [];

    return player;
  }

  hasFinished(): boolean {
    return this.finishedAt !== null;
  }
}
