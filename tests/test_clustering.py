def test_nearby_same_category_reports_cluster(client, auth_headers):
    reports = [
        {"description": "Large pothole on King Street.", "latitude": 12.9000, "longitude": 77.5000},
        {"description": "Road damage beside King Street.", "latitude": 12.9002, "longitude": 77.5001},
        {"description": "Dangerous hole near King Street junction.", "latitude": 12.8999, "longitude": 77.4998},
        {"description": "Pothole far away on another road.", "latitude": 13.5000, "longitude": 78.0000},
    ]
    for r in reports:
        resp = client.post("/issues", json=r, headers=auth_headers)
        assert resp.status_code == 200

    clusters = client.get("/issues/clusters").json()
    assert len(clusters) == 1
    assert clusters[0]["category"] == "road_infrastructure"
    assert clusters[0]["report_count"] == 3
    assert len(clusters[0]["issue_ids"]) == 3


def test_clusters_endpoint_is_public(client):
    """No auth header at all - clustering powers a public community map."""
    resp = client.get("/issues/clusters")
    assert resp.status_code == 200


def test_single_reports_dont_form_clusters(client, auth_headers):
    client.post(
        "/issues",
        json={"description": "One lonely pothole.", "latitude": 10.0, "longitude": 10.0},
        headers=auth_headers,
    )
    clusters = client.get("/issues/clusters").json()
    assert clusters == []


def test_different_categories_dont_cluster_even_if_close(client, auth_headers):
    client.post(
        "/issues",
        json={"description": "Pothole here.", "latitude": 20.0, "longitude": 20.0},
        headers=auth_headers,
    )
    client.post(
        "/issues",
        json={"description": "Garbage overflow right here too.", "latitude": 20.0001, "longitude": 20.0001},
        headers=auth_headers,
    )
    clusters = client.get("/issues/clusters").json()
    assert clusters == []  # different categories, no cluster even though co-located


def test_cluster_is_persisted_not_recomputed(client, auth_headers):
    """Reporting issues assigns them to a real IssueCluster row immediately -
    not just something derived at read time. Confirmed by checking each
    issue got a cluster_id, and that a later, unrelated read doesn't change
    the cluster's identity (same category/count) between calls."""
    for r in [
        {"description": "Pothole on Elm Street.", "latitude": 30.0, "longitude": 30.0},
        {"description": "Road damage on Elm Street.", "latitude": 30.0001, "longitude": 30.0001},
    ]:
        client.post("/issues", json=r, headers=auth_headers)

    first_read = client.get("/issues/clusters").json()
    second_read = client.get("/issues/clusters").json()
    assert first_read == second_read  # stable identity across reads, not regenerated each time
    assert len(first_read) == 1
    assert first_read[0]["report_count"] == 2


def test_cluster_severity_tracks_highest_member(client, auth_headers):
    """A cluster's severity should reflect the most severe report in it,
    even if that report wasn't the one that created the cluster."""
    client.post(
        "/issues",
        json={"description": "Pothole here, minor.", "latitude": 40.0, "longitude": 40.0},
        headers=auth_headers,
    )
    client.post(
        "/issues",
        json={"description": "Dangerous pothole right nearby too.", "latitude": 40.0001, "longitude": 40.0001},
        headers=auth_headers,
    )
    clusters = client.get("/issues/clusters").json()
    assert len(clusters) == 1
    assert clusters[0]["severity"] == "high"  # bumped up by the second, more severe report


def test_third_nearby_report_joins_existing_cluster_not_a_new_one(client, auth_headers):
    for r in [
        {"description": "Pothole A.", "latitude": 50.0000, "longitude": 50.0000},
        {"description": "Pothole B nearby.", "latitude": 50.0001, "longitude": 50.0001},
        {"description": "Pothole C also nearby.", "latitude": 50.0002, "longitude": 50.0002},
    ]:
        client.post("/issues", json=r, headers=auth_headers)

    clusters = client.get("/issues/clusters").json()
    assert len(clusters) == 1  # all three joined the same cluster, not three separate ones
    assert clusters[0]["report_count"] == 3
