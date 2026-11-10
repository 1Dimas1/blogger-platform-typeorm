export const GAME_QUESTIONS_COUNT = 5;

// once one player has answered everything, the other one has this long to finish
export const FINISH_GAME_TIMEOUT_MS = 10_000;

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}
