// Define variables
var demoInfo = d3.select("#sample-metadata");
var legendNames = ["Urban", "Non-urban"];

// Function to initialize page upon load
function init() {
    var url = "/api/statelist";
    d3.json(url).then(function (menuData) {
        console.log(menuData);

        // Prepare menu items for State dropdown
        for (var i = 0; i < menuData.length; i++) {
            d3.select("#selDataset")
                .append("option").text(menuData[i].State);
        }

        // Populate demographic info box with first ID
        var state = menuData[0].State;
        
        url = "/api/" + state + "/counties";
        d3.json(url).then(function (countyData) {
            console.log(countyData);
         // Prepare menu items for County dropdown
            d3.select("#selCountyDataset")
                    .append("option").text("--Select--");

            for (var i = 0; i < countyData.length; i++) {
                d3.select("#selCountyDataset")
                    .append("option").text(countyData[i].County);
            }

            plotAndInfo(state);
            plotLineGraph(state);
        })
    });
};

function optionChanged(option) {
    // Delete previous trace if any
    deleteTrace("scatter-state");

    // Get the state abbreviation equivalent
    var url = "/api/statelist";

    d3.json(url).then(function (stateList) {
        console.log(stateList);
        abbrevDict = stateList.filter(d => d.State === option);
        state = abbrevDict[0].State;

        url = "/api/" + state + "/counties";
        d3.json(url).then(function (countyData) {
            console.log(countyData);
            // Empty county dropdown
            d3.select("#selCountyDataset").html("");
            // Prepare menu items for county dropdown
            d3.select("#selCountyDataset")
                    .append("option").text("--Select--");

            for (var i = 0; i < countyData.length; i++) {
                d3.select("#selCountyDataset")
                    .append("option").text(countyData[i].County);
            }

            plotAndInfo(state);
            plotLineGraph(state);
        });
    });
};

// Plot scatterplot and insert new state info
function plotAndInfo(state) {
    url = "/api/v1/" + state;
    d3.json(url).then(function (plotData) {
        console.log(plotData);

        var x_values = [];
        var y_values = [];
        var ruca_groups = [];
        var county_names = [];

        for (var i = 0; i < plotData.length; i++) {
            x_values.push(plotData[i].Case_1000);
            y_values.push(plotData[i].Change);
            ruca_groups.push(plotData[i].Ruca);
            county_names.push(plotData[i].County);
        }

        // Uppercase the first letter of legend names
        for (var i = 0; i < ruca_groups.length; i++) {
            ruca_groups[i] = ruca_groups[i].charAt(0).toUpperCase() + ruca_groups[i].substr(1);
        }
        
        // Build bar graph with first ID
        var data = [{
            x: x_values,
            y: y_values, 
            mode: 'markers',
            type: 'scatter',
            name: 'County',
            text: county_names,
            marker: { 
                size: 12,
                line: {
                    color: 'rgb(255,255,255)',
                    width: 1
                }
            },
            transforms: [{ 
                type: "groupby", 
                groups: ruca_groups,
                styles: [
                    {target: legendNames[0], value: {marker: {color: 'green'}}},
                    {target: legendNames[1], value: {marker: {color: 'orange'}}},
                ]
            }],
            hovertemplate:
                "<b>%{text}</b><br><br>" +
                "%{yaxis.title.text}: %{y:.2%}<br>" +
                "%{xaxis.title.text}: %{x:.2f}<br>" +
                "<extra></extra>",
        }];

        var layout = {
            hovermode: "closest",
            hoverlabel: { bgcolor: "#FFF" },
            xaxis: {
                range: [d3.min(x_values) - 10, d3.max(x_values) + 10],
                title: "COVID cases per 1000"
            },
            yaxis: {
                range: [d3.min(y_values) - 0.01, d3.max(y_values) + 0.05],
                tickformat: ".0%",
                title: "% change in property value"
            },
            title: `% change in property value vs. COVID cases per 1000 people in ${state}`,
            autosize: false,
            width: 900,
            height: 500,
            margin: {
                l: 100,
                r: 50,
                b: 100,
                t: 100,
                pad: 10
            },
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1,
                font: {
                    family: 'sans-serif',
                    size: 12,
                    color: '#000'
                },
                bgcolor: '#E2E2E2',
                bordercolor: '#FFFFFF',
                borderwidth: 1
            },
            font: {
                family: 'Arial, sans-serif'
            }
        };

        Plotly.newPlot('scatter-state', data, layout);

        url = "/api/v2/" + state;
        d3.json(url).then(function (stateData) {
            // Clear out previous data
            demoInfo.html("");
            // Get metadata for state info
            console.log(stateData);
        
            var newStateData = {
                "State": stateData[0][0][0],
                "Cumulative COVID cases (as of Aug 31)": stateData[0][1][1],
                "Cumulative COVID deaths (as of Aug 31)": stateData[0][1][2],
                "Property Value Percent Change (Jan to Aug 2020)": (stateData[0][0][1]*100).toFixed(2)+"%"
            }

            Object.entries(newStateData).forEach((info) => {
                demoInfo.append("p").text(`${info[0]}: ${info[1]}`);
            });
        })
    })
}

function plotLineGraph(state) {
    // PLOT LINE GRAPH BY STATE
    url = "/api/v3/" + state;
    d3.json(url).then(function (plotData) {
        console.log(plotData);

        var x_values = [];
        var y_values_cases = [];
        var y_values_deaths = [];
        var y_values_value = [];

        for (var i = 0; i < plotData.length; i++) {
            x_values.push(plotData[i][0][0]); // month
            y_values_value.push(plotData[i][0][1]); // housing value
            y_values_cases.push(plotData[i][1][1]); // covid cases
            y_values_deaths.push(plotData[i][1][2]); // covid deaths
        }

        console.log(y_values_cases);
        console.log(y_values_deaths);
        console.log(y_values_value);

        // Build bar graph with first ID
        // HOUSING VALUE
        var trace1 = {
            x: x_values,
            y: y_values_value, 
            type: 'scatter',
            name: 'Property value',
        };

        // COVID CASES
        var trace2 = {
            x: x_values,
            y: y_values_cases,
            fill: 'tozeroy',
            type: 'scatter',
            yaxis: 'y2',
            name: 'COVID cases'
        };

        // COVID DEATHS
        var trace3 = {
            x: x_values,
            y: y_values_deaths, 
            fill: 'tonexty',
            type: 'scatter',
            yaxis: 'y2',
            name: 'COVID deaths'
        };

        var data = [trace3, trace2, trace1];

        var layout = {
            xaxis: {
                title: "Month"
            },
            yaxis: {
                title: "Avg property value",
                pad: 30
            },
            yaxis2: {
                title: 'Cumulative COVID cases/death',
                titlefont: {color: 'rgb(148, 103, 189)'},
                tickfont: {color: 'rgb(148, 103, 189)'},
                overlaying: 'y',
                side: 'right',
                pad: 30
            },
            title: `Avg property value, cumulative COVID cases/deaths in ${state} (Jan - Aug 2020)`,
            autosize: false,
            width: 900,
            height: 500,
            margin: {
                l: 100,
                r: 50,
                b: 100,
                t: 100,
                pad: 10
            },
            showlegend: true,
            legend: {
                orientation: 'h',
                yanchor: 'top',
                xanchor: 'center',
                y:1.09,
                x:0.5,
                font: {
                    family: 'sans-serif',
                    size: 12,
                    color: '#000'
                },
                bgcolor: '#E2E2E2',
                bordercolor: '#FFFFFF',
                borderwidth: 1
            },
            font: {
                family: 'Arial, sans-serif'
            }
        };
        Plotly.newPlot('line-state', data, layout);
    })
}

function countyChanged(county) {
    // Delete previous trace from scatterplot if any
    deleteTrace("scatter-state");

    var state = d3.select("#selDataset").node().value;
    console.log(state);

    if (county === "--Select--") {
        // RESET LINE GRAPH TO GO BACK TO STATE
        plotLineGraph(state);
    }
    else {
        // SCATTERPLOT BY COUNTY
        // Retrieve data again for x and y data of specific county
        url = "/api/" + state + "/" + county;
        d3.json(url).then(function (plotData) {
            console.log(plotData);
            var x_values = [];
            var y_values = [];
            var ruca_groups = [];
            var county_names = [];

            for (var i = 0; i < plotData.length; i++) {
                x_values.push(plotData[i].Case_1000);
                y_values.push(plotData[i].Change)
                ruca_groups.push(plotData[i].Ruca)
                county_names.push(plotData[i].County)
            }

            // Uppercase the first letter of legend names
            for (var i = 0; i < ruca_groups.length; i++) {
                ruca_groups[i] = ruca_groups[i].charAt(0).toUpperCase() + ruca_groups[i].substr(1);
            }

            // Assign color based on ruca group
            if (ruca_groups[0] === legendNames[1]){
                var markerColor = "orange";
            }
            else {
                var markerColor = "green";
            };

            // Add trace for county
            Plotly.addTraces('scatter-state', {
                x: x_values,
                y: y_values, 
                name: county,
                type: "scatter",
                mode: "markers",
                hoverinfo: "skip",
                marker: { 
                    size: 12,
                    color: markerColor,
                    line: {
                        color: 'rgb(255,0,0)',
                        width: 2
                    }
                },
            })
        })

        // LINE GRAPH BY COUNTY
        url = "/api/v3/" + state + "/" + county;
        d3.json(url).then(function (plotData) {
            console.log(plotData);

            var x_values = [];
            var y_values_cases = [];
            var y_values_deaths = [];
            var y_values_value = [];

            for (var i = 0; i < plotData.length; i++) {
                x_values.push(plotData[i].Month);
                y_values_cases.push(plotData[i].TotalCases);
                y_values_deaths.push(plotData[i].TotalDeaths);
                y_values_value.push(plotData[i].AvgHousing);
            }

            console.log(y_values_cases);
            console.log(y_values_deaths);
            console.log(y_values_value);
            
            // Build line graph with first ID
            // HOUSING VALUE
            var trace1 = {
                x: x_values,
                y: y_values_value, 
                type: 'scatter',
                name: 'Property value',
            };

            // COVID CASES
            var trace2 = {
                x: x_values,
                y: y_values_cases,
                fill: 'tozeroy',
                type: 'scatter',
                yaxis: 'y2',
                name: 'COVID cases'
            };

            // COVID DEATHS
            var trace3 = {
                x: x_values,
                y: y_values_deaths, 
                fill: 'tonexty',
                type: 'scatter',
                yaxis: 'y2',
                name: 'COVID deaths'
            };

            var data = [trace3, trace2, trace1];

            var layout = {
                xaxis: {
                    // range: [d3.min(x_values) - 10, d3.max(x_values) + 10],
                    title: "Month"
                },
                yaxis: {
                    // range: [d3.min(y_values) - 0.01, d3.max(y_values) + 0.05],
                    title: "Avg property value"
                },
                yaxis2: {
                    title: 'Cumulative COVID cases/death',
                    titlefont: {color: 'rgb(148, 103, 189)'},
                    tickfont: {color: 'rgb(148, 103, 189)'},
                    overlaying: 'y',
                    side: 'right'
                },
                title: `Avg property value, cumulative COVID cases/deaths in ${county}, ${state} (Jan - Aug 2020)`,
                autosize: false,
                width: 900,
                height: 500,
                margin: {
                    l: 100,
                    r: 50,
                    b: 100,
                    t: 100,
                    pad: 10
                },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    yanchor: 'top',
                    xanchor: 'center',
                    y:1.09,
                    x:0.5,
                    font: {
                        family: 'sans-serif',
                        size: 12,
                        color: '#000'
                    },
                    bgcolor: '#E2E2E2',
                    bordercolor: '#FFFFFF',
                    borderwidth: 1
                },
                font: {
                    family: 'Arial, sans-serif'
                }
            };
        Plotly.newPlot('line-state', data, layout);
        })
    }
};

// Delete trace with county info if exists
function deleteTrace(divId){
    try {
        Plotly.deleteTraces(divId, 1)
    }catch (error) {
        console.error(error);
    }
};

init()