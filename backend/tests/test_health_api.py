import httpx
import pytest

from never_forget.bootstrap import create_app


@pytest.mark.anyio
async def test_health_endpoint_returns_backend_status() -> None:
    transport = httpx.ASGITransport(app=create_app())
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "Never Forget API",
        "environment": "development",
        "version": "0.1.0",
    }
