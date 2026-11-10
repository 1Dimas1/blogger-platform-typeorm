import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { initSettings } from '../infrastructure/init-settings';
import { deleteAllData } from '../utils/delete-all-data';
import { TEST_CONSTANTS } from '../config/test-constants';
import { delay } from '../utils/delay';

/**
 * Quiz game (homeworks 25-28): SA questions, pair game flow, scoring with the
 * first-finisher bonus, the 10 seconds finish rule, concurrency, my games,
 * statistic and top.
 */
describe('Quiz game (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  const api = (path: string) => `/api${path}`;
  const sa = (req: request.Test) =>
    req.auth(TEST_CONSTANTS.ADMIN.LOGIN, TEST_CONSTANTS.ADMIN.PASSWORD);

  type TestUser = { id: string; login: string; token: string };
  // question body -> correct answer
  let answersByBody: Map<string, string>;

  const createUser = async (n: number): Promise<TestUser> => {
    const login = `quiz${n}`;
    const user = await sa(request(httpServer).post(api('/sa/users')))
      .send({ login, password: 'qwerty1', email: `${login}@example.com` })
      .expect(201);
    const res = await request(httpServer)
      .post(api('/auth/login'))
      .set('User-Agent', `quiz-agent-${n}`)
      .send({ loginOrEmail: login, password: 'qwerty1' })
      .expect(200);
    return { id: user.body.id, login, token: res.body.accessToken };
  };

  // fresh access token (the testing env may use a very short token lifetime)
  const relogin = async (user: TestUser): Promise<TestUser> => {
    const res = await request(httpServer)
      .post(api('/auth/login'))
      .send({ loginOrEmail: user.login, password: 'qwerty1' })
      .expect(200);
    return { ...user, token: res.body.accessToken };
  };

  const createQuestion = (body: string, correctAnswers: string[]) =>
    sa(request(httpServer).post(api('/sa/quiz/questions'))).send({
      body,
      correctAnswers,
    });

  const seedPublishedQuestions = async (count: number) => {
    answersByBody = new Map();
    for (let i = 1; i <= count; i++) {
      const body = `How much is ${i} + ${i}?`;
      const res = await createQuestion(body, [
        `${i * 2}`,
        `answer ${i}`,
      ]).expect(201);
      await sa(
        request(httpServer).put(
          api(`/sa/quiz/questions/${res.body.id}/publish`),
        ),
      )
        .send({ published: true })
        .expect(204);
      answersByBody.set(body, `${i * 2}`);
    }
  };

  const game = (path: string, user: TestUser) =>
    request(httpServer)
      .get(api(`/pair-game-quiz${path}`))
      .auth(user.token, { type: 'bearer' });

  const connect = (user: TestUser) =>
    request(httpServer)
      .post(api('/pair-game-quiz/pairs/connection'))
      .auth(user.token, { type: 'bearer' });

  const answer = (user: TestUser, value: string) =>
    request(httpServer)
      .post(api('/pair-game-quiz/pairs/my-current/answers'))
      .auth(user.token, { type: 'bearer' })
      .send({ answer: value });

  // answers the user's next question correctly or not
  const answerNext = async (user: TestUser, correct: boolean) => {
    const current = (await game('/pairs/my-current', user).expect(200)).body;
    const progress =
      current.firstPlayerProgress.player.id === user.id
        ? current.firstPlayerProgress
        : current.secondPlayerProgress;
    const question = current.questions[progress.answers.length];
    const value = correct ? answersByBody.get(question.body)! : 'wrong answer';
    return (await answer(user, value).expect(200)).body;
  };

  const startGame = async (first: TestUser, second: TestUser) => {
    await connect(first).expect(200);
    return (await connect(second).expect(200)).body;
  };

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    httpServer = result.httpServer;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('SA questions', () => {
    it('creates, lists, filters, updates, publishes and deletes questions', async () => {
      const created = await createQuestion('What is the capital of France?', [
        'Paris',
      ]).expect(201);
      expect(created.body).toEqual({
        id: expect.any(String),
        body: 'What is the capital of France?',
        correctAnswers: ['Paris'],
        published: false,
        createdAt: expect.any(String),
        updatedAt: null,
      });
      await createQuestion('How many continents are there?', [
        '7',
        'seven',
      ]).expect(201);

      const id = created.body.id;
      await sa(request(httpServer).put(api(`/sa/quiz/questions/${id}/publish`)))
        .send({ published: true })
        .expect(204);

      const published = await sa(
        request(httpServer).get(api('/sa/quiz/questions')),
      )
        .query({ publishedStatus: 'published' })
        .expect(200);
      expect(published.body.totalCount).toBe(1);
      expect(published.body.items[0]).toMatchObject({ id, published: true });
      expect(published.body.items[0].updatedAt).toEqual(expect.any(String));

      const search = await sa(
        request(httpServer).get(api('/sa/quiz/questions')),
      )
        .query({ bodySearchTerm: 'CONTINENTS', pageSize: 5 })
        .expect(200);
      expect(search.body).toMatchObject({ totalCount: 1, pageSize: 5 });

      await sa(request(httpServer).put(api(`/sa/quiz/questions/${id}`)))
        .send({
          body: 'What is the capital of Italy?',
          correctAnswers: ['Rome'],
        })
        .expect(204);
      const all = await sa(request(httpServer).get(api('/sa/quiz/questions')))
        .query({ sortBy: 'body', sortDirection: 'asc' })
        .expect(200);
      expect(all.body.items.map((q: any) => q.body)).toEqual([
        'How many continents are there?',
        'What is the capital of Italy?',
      ]);

      // default sortBy=createdAt must honour the direction (regression)
      const asc = await sa(request(httpServer).get(api('/sa/quiz/questions')))
        .query({ sortDirection: 'asc' })
        .expect(200);
      const desc = await sa(
        request(httpServer).get(api('/sa/quiz/questions')),
      ).expect(200);
      expect(asc.body.items.map((q: any) => q.id)).toEqual(
        [...desc.body.items].reverse().map((q: any) => q.id),
      );
      expect(asc.body.items[0].id).toBe(id);

      await sa(
        request(httpServer).delete(api(`/sa/quiz/questions/${id}`)),
      ).expect(204);
      await sa(
        request(httpServer).delete(api(`/sa/quiz/questions/${id}`)),
      ).expect(404);
      await sa(request(httpServer).put(api(`/sa/quiz/questions/${id}`)))
        .send({
          body: 'What is the capital of Spain?',
          correctAnswers: ['Madrid'],
        })
        .expect(404);
    });

    it('validates input and auth', async () => {
      const short = await createQuestion('too short', ['x']).expect(400);
      // production format: errorsMessages, otherwise extensions
      const errors = short.body.errorsMessages ?? short.body.extensions;
      expect(errors[0].field).toBe('body');
      await createQuestion(
        'What is the answer to everything?',
        'not array' as any,
      ).expect(400);
      await request(httpServer)
        .post(api('/sa/quiz/questions'))
        .send({
          body: 'What is the answer to everything?',
          correctAnswers: ['42'],
        })
        .expect(401);

      const noAnswers = await createQuestion(
        'Question without answers yet?',
        [],
      ).expect(201);
      await sa(
        request(httpServer).put(
          api(`/sa/quiz/questions/${noAnswers.body.id}/publish`),
        ),
      )
        .send({ published: true })
        .expect(400);
      await sa(
        request(httpServer).put(
          api(`/sa/quiz/questions/${noAnswers.body.id}/publish`),
        ),
      )
        .send({ published: 'yes' })
        .expect(400);
    });
  });

  describe('pair game', () => {
    it('creates a pending pair, starts it on second connection, enforces access', async () => {
      await seedPublishedQuestions(6);
      const [u1, u2, u3] = [
        await createUser(1),
        await createUser(2),
        await createUser(3),
      ];

      const pending = (await connect(u1).expect(200)).body;
      expect(pending).toMatchObject({
        status: 'PendingSecondPlayer',
        secondPlayerProgress: null,
        questions: null,
        startGameDate: null,
        finishGameDate: null,
        firstPlayerProgress: {
          answers: [],
          player: { id: u1.id, login: u1.login },
          score: 0,
        },
      });
      await connect(u1).expect(403);
      await answer(u1, 'too early').expect(403);

      const active = (await connect(u2).expect(200)).body;
      expect(active.id).toBe(pending.id);
      expect(active.status).toBe('Active');
      expect(active.questions).toHaveLength(5);
      expect(active.questions[0]).toEqual({
        id: expect.any(String),
        body: expect.any(String),
      });
      expect(active.secondPlayerProgress.player).toEqual({
        id: u2.id,
        login: u2.login,
      });
      expect(active.startGameDate).toEqual(expect.any(String));

      expect((await game('/pairs/my-current', u1).expect(200)).body.id).toBe(
        pending.id,
      );
      expect(
        (await game(`/pairs/${pending.id}`, u2).expect(200)).body.status,
      ).toBe('Active');
      await game(`/pairs/${pending.id}`, u3).expect(403);
      await game('/pairs/not-a-uuid', u1).expect(400);
      await game('/pairs/6b0b3b9b-8f0e-4c55-9a8e-6f0c7b2a1c11', u1).expect(404);
      await game('/pairs/my-current', u3).expect(404);
      await request(httpServer)
        .get(api('/pair-game-quiz/pairs/my-current'))
        .expect(401);
    });

    it('scores answers (case/space insensitive), gives the first finisher a bonus and finishes', async () => {
      await seedPublishedQuestions(5);
      const [u1, u2] = [await createUser(1), await createUser(2)];
      const started = await startGame(u1, u2);

      // u1: 3 correct (one with different case/spaces), finishes first
      const current = (await game('/pairs/my-current', u1).expect(200)).body;
      const firstAnswer = answersByBody.get(current.questions[0].body)!;
      const a1 = (
        await answer(u1, `  ${firstAnswer.toUpperCase()} `).expect(200)
      ).body;
      expect(a1).toEqual({
        questionId: current.questions[0].id,
        answerStatus: 'Correct',
        addedAt: expect.any(String),
      });
      await answerNext(u1, true);
      await answerNext(u1, true);
      expect((await answerNext(u1, false)).answerStatus).toBe('Incorrect');
      await answerNext(u1, false);
      await answer(u1, 'one more').expect(403);

      // u2: 4 correct, finishes second
      for (const correct of [true, true, true, true, false]) {
        await answerNext(u2, correct);
      }

      const finished = (await game(`/pairs/${started.id}`, u1).expect(200))
        .body;
      expect(finished.status).toBe('Finished');
      expect(finished.finishGameDate).toEqual(expect.any(String));
      expect(finished.firstPlayerProgress.score).toBe(4); // 3 + bonus
      expect(finished.secondPlayerProgress.score).toBe(4);
      expect(finished.firstPlayerProgress.answers).toHaveLength(5);
      await game('/pairs/my-current', u1).expect(404);
      await answer(u2, 'after finish').expect(403);

      // both can start a new game afterwards
      await connect(u2).expect(200);
    });

    it('finishes the game 10 seconds after the first player finished', async () => {
      await seedPublishedQuestions(5);
      const u1 = await createUser(1);
      let u2 = await createUser(2);
      const started = await startGame(u1, u2);

      for (let i = 0; i < 5; i++) await answerNext(u1, i < 2); // 2 correct
      await answerNext(u2, true);
      await answerNext(u2, true);
      await answerNext(u2, true); // 3 correct, 2 unanswered

      expect(
        (await game('/pairs/my-current', u2).expect(200)).body.status,
      ).toBe('Active');
      await delay(10_500);
      u2 = await relogin(u2);

      await game('/pairs/my-current', u2).expect(404);
      await answer(u2, 'too late').expect(403);
      const finished = (await game(`/pairs/${started.id}`, u2).expect(200))
        .body;
      expect(finished.status).toBe('Finished');
      expect(finished.firstPlayerProgress.score).toBe(3); // 2 + bonus
      expect(finished.secondPlayerProgress.score).toBe(3); // unanswered = incorrect
      expect(finished.secondPlayerProgress.answers).toHaveLength(3);
    }, 30_000);

    it('pairs concurrently connecting users without double booking', async () => {
      await seedPublishedQuestions(5);
      const users: TestUser[] = [];
      for (let i = 1; i <= 4; i++) users.push(await createUser(i));

      const results = await Promise.all(users.map((u) => connect(u)));
      expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);

      const games = new Map<string, Set<string>>();
      for (const u of users) {
        const g = (await game('/pairs/my-current', u).expect(200)).body;
        expect(g.status).toBe('Active');
        games.set(g.id, (games.get(g.id) ?? new Set()).add(u.id));
      }
      expect([...games.values()].map((s) => s.size)).toEqual([2, 2]);

      // simultaneous answers of both players are all recorded
      const [p1, p2] = users;
      const pairOf = (await game('/pairs/my-current', p1).expect(200)).body;
      const partner =
        pairOf.firstPlayerProgress.player.id === p1.id
          ? pairOf.secondPlayerProgress.player.id
          : pairOf.firstPlayerProgress.player.id;
      const other = users.find((u) => u.id === partner)!;
      await Promise.all([
        answer(p1, 'x').expect(200),
        answer(other, 'y').expect(200),
      ]);
      const after = (await game('/pairs/my-current', p1).expect(200)).body;
      expect(after.firstPlayerProgress.answers).toHaveLength(1);
      expect(after.secondPlayerProgress.answers).toHaveLength(1);
      void p2;
    });
  });

  describe('my games, statistic, top', () => {
    it('returns my games sorted and paginated and computes statistics and top', async () => {
      await seedPublishedQuestions(5);
      const [u1, u2, u3] = [
        await createUser(1),
        await createUser(2),
        await createUser(3),
      ];

      // game 1: u1 (5 correct) vs u2 (1 correct) -> u1 wins 6:1
      await startGame(u1, u2);
      for (let i = 0; i < 5; i++) await answerNext(u1, true);
      for (let i = 0; i < 5; i++) await answerNext(u2, i === 0);
      // game 2: u2 (2 correct, first) vs u1 (1 correct) -> u2 wins 3:1
      await startGame(u2, u1);
      for (let i = 0; i < 5; i++) await answerNext(u2, i < 2);
      for (let i = 0; i < 5; i++) await answerNext(u1, i === 0);
      // game 3: u1 vs u3, draw 0:0
      await startGame(u1, u3);
      for (let i = 0; i < 5; i++) await answerNext(u1, false);
      for (let i = 0; i < 5; i++) await answerNext(u3, false);
      // game 4: u1 pending (not counted in statistics)
      await connect(u1).expect(200);

      const my = (
        await game('/pairs/my', u1).query({ pageSize: 3 }).expect(200)
      ).body;
      expect(my).toMatchObject({
        totalCount: 4,
        pagesCount: 2,
        page: 1,
        pageSize: 3,
      });
      expect(my.items[0].status).toBe('PendingSecondPlayer'); // newest first
      const oldestFirst = (
        await game('/pairs/my', u1)
          .query({ sortBy: 'pairCreatedDate', sortDirection: 'asc' })
          .expect(200)
      ).body;
      expect(oldestFirst.items[0].status).toBe('Finished');
      expect(oldestFirst.items[3].status).toBe('PendingSecondPlayer');
      const byStatus = (
        await game('/pairs/my', u1)
          .query({ sortBy: 'status', sortDirection: 'asc' })
          .expect(200)
      ).body;
      expect(byStatus.items.map((g: any) => g.status)).toEqual([
        'Finished',
        'Finished',
        'Finished',
        'PendingSecondPlayer',
      ]);

      expect((await game('/users/my-statistic', u1).expect(200)).body).toEqual({
        sumScore: 7,
        avgScores: 2.33,
        gamesCount: 3,
        winsCount: 1,
        lossesCount: 1,
        drawsCount: 1,
      });
      expect(
        (await game('/users/my-statistic', u3).expect(200)).body,
      ).toMatchObject({
        gamesCount: 1,
        drawsCount: 1,
        avgScores: 0,
      });

      const top = (
        await request(httpServer)
          .get(api('/pair-game-quiz/users/top'))
          .expect(200)
      ).body;
      expect(top.totalCount).toBe(3);
      expect(top.items.map((i: any) => i.player.login)).toEqual([
        u1.login,
        u2.login,
        u3.login,
      ]);
      expect(top.items[0]).toMatchObject({
        sumScore: 7,
        avgScores: 2.33,
        gamesCount: 3,
      });

      const bySum = (
        await request(httpServer)
          .get(api('/pair-game-quiz/users/top'))
          .query({ sort: ['sumScore asc', 'gamesCount desc'], pageSize: 2 })
          .expect(200)
      ).body;
      expect(bySum).toMatchObject({
        totalCount: 3,
        pagesCount: 2,
        pageSize: 2,
      });
      expect(bySum.items.map((i: any) => i.player.login)).toEqual([
        u3.login,
        u2.login,
      ]);
    });
  });
});
