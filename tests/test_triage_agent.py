from app.agents.triage_agent import _keyword_classify, run


def test_classifies_pothole_as_road_infrastructure():
    category, severity = _keyword_classify("There is a large pothole near this location.")
    assert category == "road_infrastructure"
    assert severity == "normal"


def test_classifies_garbage_as_waste_management():
    category, severity = _keyword_classify("Garbage has not been collected for several days.")
    assert category == "waste_management"


def test_classifies_water_leak_as_water_authority():
    category, severity = _keyword_classify("Water leak flooding the street outside my house.")
    assert category == "water_authority"


def test_streetlight_wins_over_road_keyword():
    """Regression: 'streetlight on main road' must not fall through to
    road_infrastructure just because 'road' appears in the text."""
    category, severity = _keyword_classify("Broken streetlight on main road, dangerous at night.")
    assert category == "electrical_infrastructure"


def test_dangerous_triggers_high_severity():
    category, severity = _keyword_classify("There is a dangerous pothole here.")
    assert severity == "high"


def test_emergency_words_trigger_emergency_severity():
    category, severity = _keyword_classify("There is a gas leak emergency here.")
    assert severity == "emergency"


def test_unrecognized_text_falls_back_to_other():
    category, severity = _keyword_classify("Something strange is happening nearby.")
    assert category == "other"


def test_run_urgency_hint_bumps_severity_up_only():
    # normal severity text, but user selected "emergency" urgency
    result = run("A regular pothole.", urgency_hint="emergency")
    assert result["severity"] == "emergency"

    # dangerous text (high), user selected "low" urgency - should NOT be downgraded
    result2 = run("A dangerous pothole.", urgency_hint="low")
    assert result2["severity"] == "high"
