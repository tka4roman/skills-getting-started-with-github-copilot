from copy import deepcopy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    original_activities = deepcopy(activities)
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        activities.clear()
        activities.update(original_activities)


def activity_signup_url(activity_name: str) -> str:
    return f"/activities/{quote(activity_name, safe='')}/signup"


def test_get_activities_returns_activity_details(client: TestClient):
    # Arrange
    activity_name = "Programming Class"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    activity_data = response.json()
    assert activity_name in activity_data
    assert activity_data[activity_name]["participants"] == [
        "emma@mergington.edu",
        "sophia@mergington.edu",
    ]


def test_signup_adds_participant(client: TestClient):
    # Arrange
    activity_name = "Programming Class"
    email = "new.student@mergington.edu"

    # Act
    response = client.post(activity_signup_url(activity_name), params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Signed up {email} for {activity_name}"
    }
    assert email in client.get("/activities").json()[activity_name]["participants"]


def test_signup_rejects_duplicate_participant(client: TestClient):
    # Arrange
    activity_name = "Programming Class"
    email = "emma@mergington.edu"

    # Act
    response = client.post(activity_signup_url(activity_name), params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_rejects_unknown_activity(client: TestClient):
    # Arrange
    activity_name = "Unknown Activity"
    email = "new.student@mergington.edu"

    # Act
    response = client.post(
        activity_signup_url(activity_name),
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_removes_participant(client: TestClient):
    # Arrange
    activity_name = "Programming Class"
    email = "emma@mergington.edu"

    # Act
    response = client.delete(activity_signup_url(activity_name), params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Unregistered {email} from {activity_name}"
    }
    assert email not in client.get("/activities").json()[activity_name]["participants"]


def test_unregister_rejects_unregistered_participant(client: TestClient):
    # Arrange
    activity_name = "Programming Class"
    email = "not.registered@mergington.edu"

    # Act
    response = client.delete(
        activity_signup_url(activity_name),
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_unregister_rejects_unknown_activity(client: TestClient):
    # Arrange
    activity_name = "Unknown Activity"
    email = "new.student@mergington.edu"

    # Act
    response = client.delete(
        activity_signup_url(activity_name),
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
