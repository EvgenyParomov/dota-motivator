# Dota Motivator

Десктоп-приложение для игроков Dota 2: отслеживает матчи через GSI, ведёт виртуальный баланс «каток», блокирует запуск Dota когда баланс на нуле.

- Лендинг: https://dota-motivator.paromovevg.pro
- API: https://api.dota-motivator.paromovevg.pro
- S3 (MinIO): https://s3.dota-motivator.paromovevg.pro
- Скачать (последний релиз): https://github.com/EvgenyParomov/dota-motivator/releases/latest

## Стек

- **apps/server** — Express + Drizzle ORM + better-auth, Postgres, MinIO. Inversify DI.
- **apps/desktop** — Tauri 2 + React + react-router + react-query + Tailwind. Rust-сторона: GSI listener (динамический порт 7383–7392), auth-callback listener (`:5187`), dota process control, auto-updater.
- **packages/shared** — общие TypeScript-типы и доменные правила.
- **landing/** — статический HTML на Tailwind CDN.
- **specs/** — YAML-спеки фич (проверяются `specward`).

## Локальный dev

```bash
pnpm install
pnpm infra:up                  # Postgres + MinIO в Docker
pnpm server:migrate            # Drizzle миграции
pnpm server:dev                # API на :4000 (требует apps/server/.env)
pnpm desktop:tauri:dev         # Tauri окно + Vite на :5174
```

Шаблон env лежит в `.env.example` — скопируй в `apps/server/.env`. Сервер читает env через `node --env-file=.env`, dev-скрипт уже это делает.

## Релизы

Релизы выпускаются GitHub Actions ([release.yml](.github/workflows/release.yml)) при пуше git-тега `v*`. CI собирает Windows-инсталляторы, подписывает их Tauri-ключом (private key хранится в GH secret `TAURI_SIGNING_PRIVATE_KEY`) и публикует в GitHub Releases вместе с `latest.json` для auto-updater'а.

### Как выпустить новую версию

1. Бампни версию в **трёх местах** (должны совпадать):
   - `apps/desktop/src-tauri/tauri.conf.json` — `"version"`
   - `apps/desktop/src-tauri/Cargo.toml` — `version`
   - `apps/desktop/src-tauri/Cargo.lock` — строка с `name = "dm-desktop"`

   Локальный `cargo check` в `apps/desktop/src-tauri/` обновит lock автоматически.

2. Закоммить и тагни:
   ```bash
   git commit -am "release: 0.0.X"
   git tag v0.0.X
   git push origin main v0.0.X
   ```

3. CI запускается на push тега `v*`, собирает:
   - `Dota.Motivator_<v>_x64-setup.exe` (NSIS) + `.sig`
   - `Dota.Motivator_<v>_x64_en-US.msi` + `.sig`
   - `latest.json` — манифест для tauri-updater

   Артефакты заливаются в GitHub Release. Тест: установи предыдущую версию, дождись запуска приложения — баннер «Доступно обновление» появится через час (или сразу при перезапуске).

4. Кеш `/releases/latest` на API живёт 10 мин; если хочется обновить сейчас — передеплой dota-motivator-api в Coolify.

### Локальная сборка (без CI)

```bash
$env:VITE_SERVER_URL = "https://api.dota-motivator.paromovevg.pro"
cd apps/desktop
pnpm tauri:build
```

Результат: `apps/desktop/src-tauri/target/release/bundle/{nsis,msi}/`. Без `VITE_SERVER_URL` сборка зашьёт `http://localhost:4000` и не подойдёт для прода.

## Production deploy (Coolify)

Все сервисы стоят в Coolify под одним проектом. Адреса:

| Ресурс | Тип | Адрес |
|---|---|---|
| landing | static (nginx) | https://dota-motivator.paromovevg.pro |
| api | Dockerfile (`apps/server/Dockerfile`) | https://api.dota-motivator.paromovevg.pro |
| postgres | postgres:17-alpine | internal |
| minio | docker-compose | https://s3.dota-motivator.paromovevg.pro |

UUID-ы ресурсов лежат локально в `.deploy-notes` (не коммитится). Coolify API-токен — в `.deploy-key` (тоже в `.gitignore`).

### Деплой кода

Coolify подтягивает из публичного репо `EvgenyParomov/dota-motivator`, ветка `main`. Push в main **не** триггерит автодеплой (webhook не настроен). Деплой запускается:

- из UI Coolify → ресурс → **Deploy**
- через API:
  ```bash
  curl -H "Authorization: Bearer $(cat .deploy-key | tail -1)" \
    "$(cat .deploy-key | head -1)/api/v1/deploy?uuid=$UUID&force=true"
  ```

### Env vars у API

Хранятся в Coolify. При изменении — Patch через API и restart/redeploy:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"BETTER_AUTH_URL","value":"https://...","is_preview":false,"is_literal":true}' \
  "$COOLIFY_URL/api/v1/applications/$API_UUID/envs"
```

### DNS

Все `*.dota-motivator.paromovevg.pro` указывают A на IP сервера Coolify. SSL — Let's Encrypt через Coolify-Traefik, выпускается автоматически при первом запросе.

### MinIO Traefik

Coolify-Traefik вешает домен на сервис `minio` через явные labels в `docker_compose_raw`. Если меняешь хост — обнови оба:
1. `traefik.http.routers.minio-https.rule=Host('<новый-домен>')` в compose
2. env `MINIO_ENDPOINT` у API

## Секреты и ключи

| Что | Где локально | Где забэкаплено | Где в CI |
|---|---|---|---|
| Tauri private key | `~/.tauri/dota-motivator.key` | `s3://dm-secrets/tauri-updater.key` | GH secret `TAURI_SIGNING_PRIVATE_KEY` |
| Tauri passphrase | `~/.tauri/dota-motivator.key.password` | `s3://dm-secrets/tauri-updater.key.password` | GH secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` |
| Tauri public key | `~/.tauri/dota-motivator.key.pub` | `s3://dm-secrets/tauri-updater.key.pub` | вшит в `tauri.conf.json` |
| Coolify API token + URL | `.deploy-key` (в gitignore) | — | — |
| Coolify UUIDs | `.deploy-notes` (в gitignore) | — | — |
| MinIO/Postgres creds | в Coolify env vars | — | — |
| GitHub PAT | системный gh CLI | — | — |

**Если потеряешь Tauri private key или его пароль — auto-update сломается для всех уже установленных пользователей.** Скачать копию ключей из MinIO:

```bash
docker run --rm -v "$PWD:/out" --entrypoint /bin/sh minio/mc -c \
  "mc alias set p https://s3.dota-motivator.paromovevg.pro minio-root \$MINIO_ROOT_PASSWORD && \
   mc cp p/dm-secrets/tauri-updater.key /out/"
```

(`MINIO_ROOT_PASSWORD` — берёшь из env-vars `dota-motivator-minio` сервиса в Coolify UI.)

## Полезные команды

```bash
# Тест GSI без Dota (отправит фейковый post_game)
curl -X POST http://127.0.0.1:7383/gsi -H "Content-Type: application/json" \
  -d '{"map":{"matchid":"7777","game_state":"DOTA_GAMERULES_STATE_POST_GAME","lobby_type":"public"}}'

# Принудительно очистить кеш /releases/latest на API
# (передеплой API сбросит in-memory cache)
```
