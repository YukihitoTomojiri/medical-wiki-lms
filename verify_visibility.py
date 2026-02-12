import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_visibility(user_id, description):
    print(f"\n--- Testing for: {description} (User ID: {user_id}) ---")
    headers = {"X-User-Id": str(user_id)}
    
    # 1. Get visible events for user
    response = requests.get(f"{BASE_URL}/training/events", headers=headers)
    if response.status_code == 200:
        events = response.json()
        print(f"Found {len(events)} visible events.")
        for e in events:
            print(f"- ID: {e['id']}, Title: {e['title']}, Facility: {e.get('facilityId')}")
    else:
        print(f"Failed to get events: {response.status_code}")

if __name__ == "__main__":
    # Test with some known IDs from data seeder/expected state
    # Admin (should see all)
    test_visibility(1, "Admin User")
    # General User 1 (facility_id=1?)
    test_visibility(2, "General User at Facility 1")
    # General User 2 (facility_id=2?)
    test_visibility(3, "General User at Facility 2")
