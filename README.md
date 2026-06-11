# Never Forget

Monorepo foundation for the Never Forget app.

## Local setup

```powershell
pnpm install
pnpm --dir webapp install
uv sync --project backend
```

## Launch both apps together

VS Code alternative:

- launch the `Never Forget Full Stack` compound profile

## Module checks

Backend:

```powershell
cd backend
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\mypy.exe src tests
.\.venv\Scripts\pytest.exe
```

Frontend:

```powershell
cd webapp
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Git hooks

```powershell
pnpm install
node .\node_modules\lefthook\bin\index.js install
```
