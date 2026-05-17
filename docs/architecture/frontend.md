# Архитектура фронтенда

## Слои верхнего уровня

```
app  →  features  →  shared
```

Стрелка — направление зависимостей.

- `app/` — корень React-приложения: провайдеры, роутинг, сборка контекстов.
- `features/` — независимые фичи. **Прямого импорта между фичами нет.**
- `shared/` — переиспользуемое.

### Связь между фичами

Только через **контексты-порты** из `shared/ports/`. См. ниже.

## Структура фичи

```
features/<feature>/
├── domain/
├── ui/
├── model/
└── compose/
```

Направление зависимостей: `compose → ui | model → domain`.

### `domain/`

- Типы и чистые функции (бизнес-правила фронта: форматтеры, валидаторы, локальные расчёты).
- **React-контексты для связи компонентов в обход дерева React.** Основные сценарии:
  - передача данных между хуками `model` (например, `UserIdContext`, связывающий несколько `useX(userId)`-хуков без пропс-дриллинга);
  - получение компонентов извне — `app/` (или другая фича через `app/`) кладёт реализацию в провайдер, фича её потребляет через контекст;
  - реже — внутрифичевая инверсия (подмена реализации в `ui`/`model` через `compose`).
- Никаких react-hook'ов, никакой вёрстки, никаких сайд-эффектов.

```ts
// features/lot/domain/lot.ts
export type LotView = { id: string; name: string; sphere: Sphere; reward: number };

// features/lot/domain/contexts.ts
export const UserIdContext = createContext<UserId | null>(null);
export const LotsListSlotsContext = createContext<LotsListSlots>(defaultSlots);
```

### `ui/`

- Вся **вёрстка**.
- UI-логика: анимации, работа с рефами, фокусом, скроллом, key-handler'ы.
- Не знает про data fetching, не дергает react-query.
- Данные и колбэки приходят пропсами. Для гибкости — **слоты и render-props**.

```tsx
// features/lot/ui/lot-card.tsx
export const LotCard = ({ title, sphere, slots }: LotCardProps) => (
  <div className="card">
    <h3>{title}</h3>
    <SphereBadge sphere={sphere} />
    {slots.action}
  </div>
);
```

### `model/`

- Работа с данными и стейт-менеджерами: react-query, zustand/jotai, локальный кэш.
- Чистые хуки, возвращающие данные и действия. **Без вёрстки.**
- Каждый хук — одна ответственность (SRP).

```ts
// features/lot/model/use-lots.ts
export const useLots = () => useQuery({ queryKey: ['lots'], queryFn: api.lots.list });

// features/lot/model/use-execute-lot.ts
export const useExecuteLot = () => useMutation({ mutationFn: api.lots.execute });
```

### `compose/`

Связывает `model` и `ui` в полезные блоки. Также соединяет `ui ↔ ui` и `model ↔ model`.

**Формат:**

- Чаще всего compose — это **React-компонент без своей вёрстки**: вызывает хуки из `model`, вкладывает результаты в слоты `ui`-компонентов.
- Может быть и **хук-композит**, когда нужно собрать данные/действия из нескольких `model`-хуков без рендера, чтобы переиспользовать сборку в нескольких местах.
- Compose может **импортировать другой compose** (и компонент, и хук).

**Жёсткие правила:**

- В `compose` **нет сырых react-hook'ов** (`useState`, `useEffect`, `useMemo`, `useRef` и т.п.). Локальный UI-state — в `ui`, данные/мутации — в `model`.
- В `compose` **нет вёрстки и нет нативных HTML/JSX-элементов**. Запрещены любые «голые» теги (`<div>`, `<span>`, `<p>`, `<h1>`-`<h6>`, `<button>`, `<input>`, `<form>`, `<ul>`, `<li>`, `<a>`, `<img>`, фрагменты `<>...</>` с разметкой внутри и т.п.) — как в корне рендера, так и в значениях слотов и render-props. Никаких `className`, инлайн-стилей, `style={...}`, классов раскладки. Разрешены только: вызов компонентов из `ui/` (включая чужие порты), компонентов другого `compose` (внутри одной фичи), а также один компонент `<Navigate />` / `<Outlet />` из роутера для редиректов и точек подключения роута.
- Если в `compose` потребовалась «обёртка» (например, два кнопки рядом, заголовок и описание блока, контейнер с отступом) — это сигнал, что не хватает `ui/`-компонента: создай его и передавай в слот готовый компонент, а не разметку.
- Хуки из `model` между собой **не вяжутся напрямую** — для этого создаётся compose-компонент или compose-хук, чтобы каждый model-хук сохранял SRP.
- `domain` нужен `compose`, чтобы получать общие типы и связывать данные между несколькими model-хуками без прямой связи.

**Что делать с сайд-эффектами (`useEffect`) и локальным состоянием формы.** Они тоже не живут в `compose`:

- эффекты, привязанные к данным/мутациям (подписки на события Tauri, синхронизация query-кэша, редиректы по результату запроса) — в `model/` отдельным хуком (`useXxxOrchestrator`, `useXxxRedirect`);
- состояние формы и UI-флаги — в `ui/`-компоненте, который рендерит форму и принимает `onSubmit(input)` пропсом.

Compose-компонент:

```tsx
// features/lot/compose/lot-card.compose.tsx
export const LotCardCompose = ({ lotId }: { lotId: string }) => {
  const { data: lot } = useLot(lotId);
  const execute = useExecuteLot();
  if (!lot) return null;
  return (
    <LotCard
      title={lot.name}
      sphere={lot.sphere}
      slots={{ action: <RunLotButton onClick={() => execute.mutate(lot.id)} /> }}
    />
  );
};
```

Compose-хук (когда сборка нужна без рендера):

```ts
// features/lot/compose/use-lot-card.compose.ts
export const useLotCardCompose = (lotId: string) => {
  const { data: lot } = useLot(lotId);
  const execute = useExecuteLot();
  return { lot, runLot: () => lot && execute.mutate(lot.id) };
};
```

Compose, импортирующий другой compose (внутри одной фичи):

```tsx
// features/lot/compose/lots-list.compose.tsx
import { LotCardCompose } from './lot-card.compose';

export const LotsListCompose = () => {
  const { data: ids } = useLotIds();
  return (
    <LotsList
      slots={{ items: ids?.map((id) => <LotCardCompose key={id} lotId={id} />) }}
    />
  );
};
```

Для кросс-фичевого использования compose другой фичи не импортируется — нужный компонент/хук приходит через контекст из `shared/ports/`.

## Слоты и render-props как способ обеспечить SRP

Компонент в `ui/` — это «оболочка с дырками». В дырки `compose` вставляет конкретные блоки.

- Контейнер задаёт **раскладку и UI-поведение**.
- В слоты — конкретные ui-компоненты или результаты model-хуков.
- Один и тот же `ui/`-компонент может быть собран `compose`'ом в разные варианты.

## `shared/`

```
shared/
├── domain/
├── ui/
├── model/
├── lib/
└── ports/
```

- `domain` — общие типы и чистые функции.
- `ui` — общие компоненты (кнопки, поля, лейаут).
- `model` — общие хуки (auth-сессия, http-клиент, общий react-query конфиг).
- `lib` — самописная инфраструктура (формат дат, хелперы, утилиты).
- `ports/` — **единственный канал кросс-фичевого общения**.

### `shared/ports/` — кросс-фичевые контексты

Контекст-порт может содержать:

- компоненты,
- хуки,
- просто данные.

Фича A объявляет, что ей нужно. Фича Б предоставляет реализацию. `app/` связывает.

```ts
// shared/ports/balance-widget.ts
export type BalanceWidgetPort = { Widget: ComponentType };
export const BalanceWidgetContext = createContext<BalanceWidgetPort | null>(null);
export const useBalanceWidget = () => {
  const ctx = useContext(BalanceWidgetContext);
  if (!ctx) throw new Error('BalanceWidgetContext not provided');
  return ctx;
};
```

```tsx
// features/balance/ui/balance-widget.tsx — реализация
export const BalanceWidget = () => { ... };

// app/providers.tsx — связывание
<BalanceWidgetContext.Provider value={{ Widget: BalanceWidget }}>
  ...
</BalanceWidgetContext.Provider>
```

```tsx
// features/dashboard/compose/dashboard.compose.tsx — потребитель
const { Widget } = useBalanceWidget();
return <DashboardLayout slots={{ top: <Widget /> }} />;
```

Импорт `features/dashboard → features/balance` запрещён линтером.

## Сводка правил

| Слой | Можно | Нельзя |
|------|-------|--------|
| `domain` | типы, чистые функции, контексты как DI-ключи | react-hooks, JSX, IO |
| `ui` | JSX, анимации, рефы, key-handlers, локальный `useState` для UI | data fetching, model-хуки внутри |
| `model` | react-query, zustand, http-вызовы, react-hooks | JSX |
| `compose` | вызов готовых компонентов из `ui/` и хуков из `model/`, проброс данных между ними, передача компонентов в слоты | сырые react-hooks (`useState`/`useEffect`/`useMemo`/`useRef`), любые HTML-теги (`<div>`, `<button>`, `<p>` и т.п.) даже внутри слотов, классы, инлайн-стили |
| `shared/ports` | контексты для кросс-фичевой связи | импорт из `features/*` |
