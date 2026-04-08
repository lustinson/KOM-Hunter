from math import sin, cos, atan

COEF_DRAG = 0.65 #estimate drag coeff of 0.65 for tucked in drop bars: https://link.springer.com/article/10.1007/s12283-017-0234-1/tables/1

#square meters
FRONTAL_AREA = 0.36 #princeton article https://www.princeton.edu/~maelabs/hpt/mechanics/mecha_55.htm#:~:text=The%20upright%20position%20frequently%20used%20when%20riding,close%20to%20that%20for%20a%20flat%20plate!&text=When%20two%20cyclists%20ride%20in%20a%20drafting,a%2043%%20reduction%20in%20the%20drag%20force.
CDA = COEF_DRAG*FRONTAL_AREA

AIR_DENSITY = 1.19 #average air density for temps 15-25 degC and elevations close to sea level and dew point of 9 degC
DRIVE_TRAIN_LOSS = 1.02 #2% efficiency loss

COEF_RR_CHART = { #https://coachrobmuller.blogspot.com/2017/11/rolling-resistance-revisited.html
    "low": 0.002, #tubeless, low resistance, perfect dry conditions, concrete
    "average": 0.004, #asphalt, normal conditions, dry
    "wet_average": 0.0052, #estimate that .8mm of rain causes 30% increase of RR at 30kph: https://www.hpwizard.com/rolling-resistance-vs-road-wetness.pdf
    "high": 0.008, #rough paved road or very wet conditions
    "trail": 0.012, #dirt/gravel trail, fairly packed down and ridden on: https://zwiftinsider.com/crr/#:~:text=Generally%20speaking%2C%20each%20of%20the,roll%20slower%20than%20Road%20wheels.
}

#METRIC UNITS 
avg_grade = -1.8
bike_weight = 9
rider_weight = 80
ride_conditions = "average"
wind_speed = 0
ground_speed = 58.91 #kph

speed = ground_speed/3.6 #m/s
weight = bike_weight + rider_weight
coef_RR = COEF_RR_CHART[ride_conditions]

F_grav = 9.81*sin(atan(avg_grade/100))*weight
F_rolling = 9.8067*cos(atan(avg_grade/100))*weight*coef_RR
F_drag = 0.5*CDA*AIR_DENSITY*(speed+wind_speed)**2
F_res = F_grav + F_rolling + F_drag

power_needed = DRIVE_TRAIN_LOSS * F_res * speed

print(power_needed)