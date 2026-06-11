$ErrorActionPreference = "Stop"

Push-Location "backend"
try {
    & ".\.venv\Scripts\ruff.exe" check .
    & ".\.venv\Scripts\mypy.exe" src tests
    & ".\.venv\Scripts\pytest.exe"
}
finally {
    Pop-Location
}

Push-Location "webapp"
try {
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
}
finally {
    Pop-Location
}
