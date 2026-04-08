import requests
import numpy as np
import json
from datetime import datetime, timedelta
import time


def get_activities_between_dates(before, after):
    url = f"https://www.strava.com/api/v3/athlete/activities?before={before}&after={after}&page=&per_page="
    print(url)
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()

def get_power_stream(activity_id):
    url = f"https://www.strava.com/api/v3/activities/{activity_id}/streams?keys=watts,time"
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()

def download_power_stream(activity_id, filename):
    url = f"https://www.strava.com/api/v3/activities/{activity_id}/streams?keys=watts,time"
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    activity_json = response.json()

    if activity_json:  # Only save if data is returned
        with open(filename, 'w') as f:
            json.dump(activity_json, f, indent=4)
        print(f"✅ Data saved to {filename}")
    else:
        print("⚠️ No activities found or API request failed.")


def calculate_power_curve(stream, durations: list[int]):
    power_data = next(stream['data'] for stream in stream if stream['type'] == 'watts')
    # Replace null values with 0
    power_data = [p if p is not None else 0 for p in power_data]
    time_data = next(stream['data'] for stream in stream if stream['type'] == 'time')

    power_curve = {}

    for duration in durations:
        max_avg_power = 0

        for i in range(len(time_data) - duration + 1): #sliding window
            avg_power = np.mean(power_data[i:i + duration])
            max_avg_power = max(max_avg_power, avg_power)

        power_curve[str(duration)] = int(round(max_avg_power, 0))

    return power_curve

def main():
    durations = [1,5,10,15,30,60,120,300,600,1200,1800]

    duration_tuples = [(str(duration), 0) for duration in durations]
    best_power_curve = {element[0]: element[1] for index, element in enumerate(duration_tuples)}

    #activities = get_activities_between_dates(before=time.time(), after=cutoff_date.timestamp())
    #get last month of rides with wattage data
    cutoff_date = datetime.now() - timedelta(days=90)

    """
    with open('user_activities.json', 'r') as file:
        activities = json.load(file)
        activities = [
            activity for activity in activities 
            if activity['type'] in ('Ride', 'VirtualRide') 
            and activity['device_watts'] 
            and datetime.strptime(activity["start_date"], "%Y-%m-%dT%H:%M:%SZ") > cutoff_date
        ]
        print(f"ride activities between dates with wattage data: {len(activities)}")

    for activity in activities:
        stream = get_power_stream(activity['id'])
        power_curve = calculate_power_curve(stream, durations)
        for key in power_curve:
            if power_curve[key] > best_power_curve[key]:
                best_power_curve[key] = power_curve[key]"""

    print(f"My Power Curve: \n{json.dumps(best_power_curve, indent=4)}")


if __name__ == "__main__":
    main()