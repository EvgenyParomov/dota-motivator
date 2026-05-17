# Архитектура бэкенда

## Слои верхнего уровня

```
app  →  features  →  shared
```

Стрелка — направление зависимостей. Каждый слой видит **только то, что правее**.

- `app/` — корень: сборка контейнера, HTTP-роутинг, запуск.
- `features/` — независимые бизнес-фичи. **Прямая связь между фичами запрещена.**
- `shared/` — переиспользуемое между фичами.

### Связь между фичами

Только через **инверсию зависимостей**. Если фиче А нужно поведение из Б:

1. Б объявляет порт (интерфейс) — в своей `application/ports/` или в `shared/`.
2. Б предоставляет реализацию в своих `adapters/`.
3. А зависит от порта, не зная о Б.
4. `app/` связывает порт с реализацией в контейнере.

## Структура фичи

```
features/<feature>/
├── domain/
├── application/
└── adapters/
```

Направление зависимостей: `adapters → application → domain`.

### `domain/`

Только **типы и чистые функции**, описывающие бизнес-правила.

- Никакого IO, БД, времени, рандома.
- Никакого DI и фреймворков (включая inversify).
- Внешние библиотеки — только утилитарные (lodash, date-fns, zod).

Примеры:

```ts
// features/lot/domain/lot.ts
export type Lot = { id: LotId; sphere: Sphere; reward: number; rules: LotRule[] };

// features/lot/domain/rules.ts
export const checkLotRules = (lot: Lot, history: LotExecution[]): RuleCheckResult => { ... };
```

### `application/`

- **Use-cases** — одно действие системы с точки зрения внешнего вызова (`ExecuteLotUseCase`, `CreateLotUseCase`).
- **Services** — переиспользуемая между use-case'ами бизнес-логика. Оркестрация портов, транзакции — то, что крупнее чистой функции из `domain`, но не привязано к конкретной точке входа.
- **Ports** — интерфейсы для всего внешнего: репозитории, шины, часы, кросс-фичевые контракты.

```ts
// features/lot/application/ports/lot-repository.ts
export abstract class LotRepository {
  abstract findById(id: LotId): Promise<Lot | null>;
  abstract save(lot: Lot): Promise<void>;
}

// features/lot/application/use-cases/execute-lot.ts
@injectable()
export class ExecuteLotUseCase {
  constructor(
    @inject(LotRepository) private lots: LotRepository,
    @inject(BalanceMutator) private balance: BalanceMutator,
  ) {}
  async execute(cmd: ExecuteLotCommand) { ... }
}
```

В `application/` **нет конкретных реализаций** — только интерфейсы и логика поверх них.

### `adapters/`

Реализации портов и точки входа.

- `PostgresLotRepository implements LotRepository`
- `MinioMediaStorage implements MediaStorage`
- HTTP/tRPC контроллеры
- Cron-задачи, подписчики на очереди

Адаптеры зависят от `application/` (для портов и use-cases) и `domain/` (для типов).

## `shared/`

```
shared/
├── domain/
├── application/
├── adapters/
└── lib/
```

- `domain/application/adapters` — те же смыслы, что в фиче, но переиспользуется между фичами (например, кросс-фичевые порты `Clock`, `IdGenerator`; типы `UserId`).
- `lib/` — самописные инфраструктурные модули, не относящиеся к домену: типизированный `Result`, retry-обёртка, логгер, парсер env.

## DI: inversify

- Контейнер собирается в `app/container.ts`.
- **Ключ DI = абстрактный класс**, а не `Symbol`/строка. Абстрактный класс одновременно описывает контракт (методы) и служит токеном — нет рассинхрона между интерфейсом и ключом, нет «магических строк», переименование контракта правится IDE автоматически.
- Конкретная реализация наследуется от абстрактного класса и помечается `@injectable()`. Сам абстрактный класс декоратора **не несёт**.
- Регистрация:

```ts
// features/lot/adapters/postgres-lot-repository.ts
@injectable()
export class PostgresLotRepository extends LotRepository {
  async findById(id: LotId) { ... }
  async save(lot: Lot) { ... }
}

// app/container.ts
container.bind(LotRepository).to(PostgresLotRepository);
container.bind(BalanceMutator).to(BalanceMutatorAdapter);
```

- Use-case'ы и адаптеры — `@injectable()`, зависимости через `@inject(LotRepository)`.
- В `domain/` inversify не появляется.

## Пример: match-tracking списывает катку через balance

`match-tracking` не знает о `balance`. Он зависит от порта.

1. `shared/application/ports/balance-mutator.ts`:
   ```ts
   export abstract class BalanceMutator {
     abstract debit(userId: UserId, amount: number): Promise<void>;
   }
   ```
2. `features/balance/adapters/balance-mutator.adapter.ts` — `@injectable() class BalanceMutatorAdapter extends BalanceMutator { ... }`, внутри дергает use-case'ы balance.
3. `features/match-tracking/application/use-cases/on-match-end.ts` инжектит `BalanceMutator` через `@inject(BalanceMutator)`.
4. `app/container.ts`: `container.bind(BalanceMutator).to(BalanceMutatorAdapter)`.

Импорт `features/match-tracking → features/balance` запрещён линтером.
