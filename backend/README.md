## Backend

Minimal FastAPI scaffold for Never Forget.

### Local commands

```powershell
uv sync
uv run uvicorn never_forget.bootstrap:app --reload
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\mypy.exe src tests
.\.venv\Scripts\pytest.exe
```
