from app.agents import voice_agent


def test_not_available_when_unconfigured(monkeypatch):
    monkeypatch.setattr(voice_agent, "S3_BUCKET", "")
    assert voice_agent.voice_available() is False


def test_transcribe_returns_none_when_unconfigured(monkeypatch):
    monkeypatch.setattr(voice_agent, "S3_BUCKET", "")
    result = voice_agent.transcribe_audio(b"fake audio bytes", "audio/mpeg")
    assert result is None


def test_transcribe_returns_none_for_unsupported_format(monkeypatch):
    monkeypatch.setattr(voice_agent, "S3_BUCKET", "some-bucket")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "fake")
    result = voice_agent.transcribe_audio(b"fake bytes", "audio/flac")
    assert result is None


def test_upload_audio_returns_503_when_unconfigured(client, auth_headers, monkeypatch):
    import app.routers.uploads as uploads_module
    monkeypatch.setattr(uploads_module, "voice_available", lambda: False)

    resp = client.post(
        "/uploads/audio",
        files={"file": ("report.mp3", b"fake audio content", "audio/mpeg")},
        headers=auth_headers,
    )
    assert resp.status_code == 503


def test_upload_audio_requires_auth(client):
    resp = client.post("/uploads/audio", files={"file": ("report.mp3", b"fake", "audio/mpeg")})
    assert resp.status_code in (401, 403)


def test_issue_can_carry_a_language_code(client, auth_headers):
    resp = client.post(
        "/issues",
        json={"description": "Hay un bache grande en la calle.", "language": "es-US"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["language"] == "es-US"
