import requests
from math import sin, cos, atan
import geocoder

STRAVA_ACCESS_TOKEN = "REMOVED"
WEATHER_API_KEY = "REMOVED"

COEF_DRAG = 0.65 #estimate drag coeff of 0.65 for tucked in drop bars: https://link.springer.com/article/10.1007/s12283-017-0234-1/tables/1
FRONTAL_AREA = 0.36 #princeton article https://www.princeton.edu/~maelabs/hpt/mechanics/mecha_55.htm#:~:text=The%20upright%20position%20frequently%20used%20when%20riding,close%20to%20that%20for%20a%20flat%20plate!&text=When%20two%20cyclists%20ride%20in%20a%20drafting,a%2043%%20reduction%20in%20the%20drag%20force.
CDA = COEF_DRAG*FRONTAL_AREA
AIR_DENSITY = 1.19 #average air density for temps 15-25 degC and elevations close to sea level and dew point of 9 degC
DRIVE_TRAIN_LOSS = 1.02 #2% efficiency loss
COEF_RR_CHART = { #https://coachrobmuller.blogspot.com/2017/11/rolling-resistance-revisited.html
    "smooth": 0.002, #tubeless, low resistance, perfect dry conditions, concrete
    "average": 0.004, #asphalt, normal conditions, dry
    "wet_average": 0.0052, #estimate that .8mm of rain causes 30% increase of RR at 30kph: https://www.hpwizard.com/rolling-resistance-vs-road-wetness.pdf
    "rough": 0.008, #rough paved road or very wet conditions
    "trail": 0.012, #dirt/gravel trail, fairly packed down and ridden on: https://zwiftinsider.com/crr/#:~:text=Generally%20speaking%2C%20each%20of%20the,roll%20slower%20than%20Road%20wheels.
}



#####
# TODO: 
# - Implement wind direction detection
# - ride conditions? Wet detection
# - Explore segment coordinate quadrants
# - Database for user power curves and segment data
# 



def get_nearby_segments(lat, lon):
    url = f"https://www.strava.com/api/v3/segments/explore?bounds={lat-0.1},{lon-0.1},{lat+0.1},{lon+0.1}&activity_type=riding"
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()

def get_segment_info(segment_id):
    url = f"https://www.strava.com/api/v3/segments/{segment_id}"
    headers = {"Authorization": f"Bearer {STRAVA_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers).json()
    return response

def get_weather(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    params = {"lat": lat, "lon": lon, "appid": WEATHER_API_KEY, "units": "metric"}
    response = requests.get(url, params=params)
    return response.json()

def strava_time_to_seconds(time_str):
    if 's' in time_str:  # Case where it's in "33s" format
        return int(time_str.replace('s', ''))
    else:  # Case where it's in "4:11" format (minutes:seconds)
        minutes, seconds = map(int, time_str.split(':'))
        return minutes * 60 + seconds

def analyze_segment(segment, rider_weight, bike_weight, power_curve):
    weather = get_weather(segment["start_latlng"][0], segment["start_latlng"][1])
    #wind_speed = weather["wind"]["speed"]
    wind_speed = 0 

    wind_dir = weather["wind"]["deg"]
    #temp = weather["main"]["temp"]

    kom = segment['xoms']['kom'] 
    kom_seconds = strava_time_to_seconds(kom)
    distance = segment['distance']
    avg_grade = segment['average_grade']
    ride_conditions = "average"
    ground_speed = (distance/1000)/((kom_seconds-1)/3600) #-1 second for KOM

    speed = ground_speed/3.6 #m/s
    weight = bike_weight + rider_weight
    Coef_RR = COEF_RR_CHART[ride_conditions]

    F_grav = 9.81*sin(atan(avg_grade/100))*weight
    F_rolling = 9.8067*cos(atan(avg_grade/100))*weight*Coef_RR
    F_drag = 0.5*CDA*AIR_DENSITY*(speed+wind_speed)**2
    F_res = F_grav + F_rolling + F_drag

    print(f"Segment: {segment['name']}")
    print(f"Start Coords: {segment['start_latlng'][0]} {segment['start_latlng'][1]}")
    print(f"KOM Time: {kom}")
    print(f"Required Speed: {round(ground_speed, 1)} kph")
    print(f"Wind Speed: {wind_speed}m/s, Direction: {wind_dir}°")
    
    power_needed = DRIVE_TRAIN_LOSS * F_res * speed

    print(f"Required for KOM: {int(round(power_needed, 0))} W for {kom}\n\n")


def main():
    g = geocoder.ip('me')
    lat, lon = g.latlng

    print([lat-0.1,lon-0.1,lat+0.1,lon+0.1])


    segments = get_nearby_segments(lat, lon)
    segments = segments['segments']

    if not segments:
        print("No segments found nearby.")
        return
    
    rider_weight = float(input("Enter rider's weight (kg): "))
    bike_weight = float(input("Enter your bike's weight (kg): "))

    power_curve = {
        "1": 489,
        "5": 379,
        "10": 324,
        "15": 316,
        "30": 306,
        "60": 299,
        "120": 237,
        "300": 225,
        "600": 214,
        "1200": 205,
        "1800": 200
    }

    for segment in segments:
        #get kom time
        segment = get_segment_info(segment['id'])
        analyze_segment(segment, rider_weight, bike_weight, power_curve)

if __name__ == "__main__":
    main()
