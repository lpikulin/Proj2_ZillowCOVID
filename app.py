import os
import numpy as np
from datetime import datetime as dt, timedelta

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func

from flask import Flask, jsonify, render_template

os.chdir(os.path.dirname(os.path.abspath(__file__)))
#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///Resources/housingcovid.sqlite", connect_args={'check_same_thread': False})
# engine = create_engine("sqlite:///Resources/housingcovid.sqlite")

# Reflect an existing database into a new model
Base = automap_base()
# Reflect the tables
Base.prepare(engine, reflect=True)

# Save reference to the table
Covid = Base.classes.covid
Change = Base.classes.change
CovidCounty = Base.classes.covidcounty

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

#################################################
# Flask Routes
#################################################
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/aboutus")
def aboutus():
    return render_template("AboutUs.html")

@app.route("/analytics")
def analytics():
    return render_template("Analytics.html")

@app.route("/documentation")
def documentation():
    return render_template("Documentation.html")

@app.route("/news")
def news():
    return render_template("News.html")

@app.route("/table")
def table():
    return render_template("Table.html")

@app.route("/api/v1/<state>")
def state_plot(state):
    session = Session(engine)

    results = session.query(Change.state,
                            Change.county,
                            Change.ruca_grp,
                            func.avg(Change.case_1000), 
                            func.avg(Change.change)).\
        filter(Change.state == state).\
        group_by(Change.county).\
        order_by(Change.ruca_grp.desc()).all()
    
    session.close()

    # Create a dictionary from the row data and append to the list 'all_dates'
    all_counties = []
    for state, county, ruca, casePopAvg, houseChangeAvg in results:
        counties_dict = {}
        counties_dict["State"] = state
        counties_dict["County"] = county
        counties_dict["Ruca"] = ruca
        counties_dict["Case_1000"] = casePopAvg
        counties_dict["Change"] = houseChangeAvg
        all_counties.append(counties_dict)

    return jsonify(all_counties)

@app.route("/api/v2/<state>")
def state_info(state):
    session = Session(engine)

    results = session.query(Change.state,
                            func.sum(Change.cases),
                            func.sum(Change.deaths),
                            func.sum(Change.pop),
                            func.avg(Change.change)
                            ).\
        filter(Change.state == state).\
        group_by(Change.state).all()
    
    session.close()

    # Create a dictionary from the row data and append to the list 'all_dates'
    for state, sumCases, sumDeaths, sumPop, avgHouseChange in results:
        state_info_dict = {}
        state_info_dict["State"] = state
        state_info_dict["TotalCases"] = sumCases
        state_info_dict["TotalDeaths"] = sumDeaths
        state_info_dict["TotalPopulation"] = sumPop
        state_info_dict["Change"] = avgHouseChange

    return jsonify(state_info_dict)

@app.route("/api/statelist")
def state_list():
    session = Session(engine)
    results = session.query(Change.state, Change.abbrev).\
        distinct().\
        order_by(Change.state.asc())
    session.close()

    states_abbrev = []
    for state, abbrev in results:
        state_dict = {}
        state_dict["State"] = state
        state_dict["Abbrev"] = abbrev
        states_abbrev.append(state_dict)

    return jsonify(states_abbrev)

@app.route("/api/<state>/counties")
def county_list(state):
    session = Session(engine)
    results = session.query(Change.county).\
        filter(Change.state == state).\
        distinct().\
        order_by(Change.county.asc())
    session.close()

    state_counties = []
    for county in results:
        counties_dict = {}
        counties_dict["County"] = county
        state_counties.append(counties_dict)

    return jsonify(state_counties)

@app.route("/api/<state>/<county>")
def county_plot(state, county):
    session = Session(engine)

    results = session.query(Change.state,
                            Change.county,
                            Change.ruca_grp,
                            func.avg(Change.case_1000), 
                            func.avg(Change.change)).\
        filter(Change.state == state).\
        filter(Change.county == county).\
        group_by(Change.county).all()
    
    session.close()

    # Create a dictionary from the row data and append to the list 'all_dates'
    county_info = []
    for state, county, ruca, casePopAvg, houseChangeAvg in results:
        county_dict = {}
        county_dict["State"] = state
        county_dict["County"] = county
        county_dict["Ruca"] = ruca
        county_dict["Case_1000"] = casePopAvg
        county_dict["Change"] = houseChangeAvg
        county_info.append(county_dict)

    return jsonify(county_info)


@app.route("/api/v3/<state>")
def state_covid(state):
    session = Session(engine)

    results_values = session.query(Covid.month,
                            func.avg(Covid.value)).\
        filter(Covid.state == state).\
        group_by(Covid.month).all()
    
    results_cases_deaths = session.query(CovidCounty.month,
                                    func.sum(CovidCounty.cases),
                                    func.sum(CovidCounty.deaths)).\
        filter(CovidCounty.state == state).\
        group_by(CovidCounty.month).all()

    session.close()

    # Create a dictionary from the row data and append to the list 'all_dates'
    all_covid_state = list(zip(results_values, results_cases_deaths))
    return jsonify(all_covid_state)

    # for i in results_values:
    #     covid_state = {}
    #     covid_state["State"] = state
    #     covid_state["Month"] = month
    #     covid_state["AvgHousing"] = avgHousing
    #     covid_state["TotalCases"] = totalCases
    #     covid_state["TotalDeaths"] = totalDeaths

    #     all_covid_state.append(covid_state)

    # for month, totalCases, totalDeaths in results_cases_deaths:
    
@app.route("/api/v3/<state>/<county>")
def county_covid(state, county):
    session = Session(engine)

    results = session.query(Covid.state,
                            Covid.county,
                            Covid.month,
                            Covid.cases,
                            Covid.deaths, 
                            func.avg(Covid.value)).\
        filter(Covid.state == state).\
        filter(Covid.county == county).\
        group_by(Covid.month).all()
    
    session.close()

    # Create a dictionary from the row data and append to the list 'all_dates'
    all_covid_county = []
    for state, county, month, totalCases, totalDeaths, avgHousing in results:
        covid_county = {}
        covid_county["State"] = state
        covid_county["County"] = county
        covid_county["Month"] = month
        covid_county["TotalCases"] = totalCases
        covid_county["TotalDeaths"] = totalDeaths
        covid_county["AvgHousing"] = avgHousing
        all_covid_county.append(covid_county)

    return jsonify(all_covid_county)
@app.route("/api/national")
def nat_plot():
    session = Session(engine)
    results = session.query(Change.state,
                            func.sum(Change.cases),
                            func.sum(Change.deaths),
                            func.sum(Change.pop),
                            func.avg(Change.change)
                            )
    session.close()
    national_dict = []
    for state, cases, deaths, pop, change in results:
        nat_dict = {}
        nat_dict["name"] = state
        nat_dict["cases"] = cases
        nat_dict["deaths"] = deaths
        nat_dict["pop"]=pop
        nat_dict["change"] = change
        national_dict.append(nat_dict)
    return jsonify(national_dict) 
if __name__ == '__main__':
    app.run(debug=True)
