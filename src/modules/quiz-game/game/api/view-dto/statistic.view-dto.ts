import { ApiProperty } from '@nestjs/swagger';
import { PlayerViewDto } from './game-pair.view-dto';

// one row of GamesQueryRepository's per-player aggregation over finished games
export type PlayerStatisticRawRow = {
  userId: string;
  login: string;
  sumScore: string | number;
  avgScores: string | number;
  gamesCount: string | number;
  winsCount: string | number;
  lossesCount: string | number;
  drawsCount: string | number;
};

export class MyStatisticViewDto {
  @ApiProperty()
  sumScore: number;

  @ApiProperty({ description: 'rounded to 2 decimals' })
  avgScores: number;

  @ApiProperty()
  gamesCount: number;

  @ApiProperty()
  winsCount: number;

  @ApiProperty()
  lossesCount: number;

  @ApiProperty()
  drawsCount: number;

  static mapToView(row: PlayerStatisticRawRow | undefined): MyStatisticViewDto {
    return {
      sumScore: Number(row?.sumScore ?? 0),
      avgScores: Number(row?.avgScores ?? 0),
      gamesCount: Number(row?.gamesCount ?? 0),
      winsCount: Number(row?.winsCount ?? 0),
      lossesCount: Number(row?.lossesCount ?? 0),
      drawsCount: Number(row?.drawsCount ?? 0),
    };
  }
}

export class TopGamePlayerViewDto extends MyStatisticViewDto {
  @ApiProperty({ type: PlayerViewDto })
  player: PlayerViewDto;

  static mapToTopView(row: PlayerStatisticRawRow): TopGamePlayerViewDto {
    return {
      ...MyStatisticViewDto.mapToView(row),
      player: { id: row.userId, login: row.login },
    };
  }
}
