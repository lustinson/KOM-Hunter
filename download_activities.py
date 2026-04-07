from datetime import datetime, timedelta
import requests
import json 

STRAVA_ACCESS_TOKEN = "REMOVED"


def download_saved_activities(before, after, filename):
    activities_json = get_activities_between_dates(before, after)
    if activities_json:  # Only save if data is returned
        with open(filename, 'w') as f:
            json.dump(activities_json, f, indent=4)
        print(f"✅ Data saved to {filename}")
    else:
        print("⚠️ No activities found or API request failed.")


def get_activities_between_dates(before, after):
    url = f"https://www.strava.com/api/v3/athlete/activities?before={before}&after={after}&per_page=100"
    print(url)
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()


def main():

    download_saved_activities(before=datetime.now().timestamp(), after=datetime(2024,11,2).timestamp(), filename="user_activities.json")

if __name__ == "__main__":
    main()