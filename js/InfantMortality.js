/* global d3:true, nv:true */
function IMRvsLiteracy() {
    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) {
        return d.infant_mortality;
    }

    function y(d) {
        return d.literacy;
    }

    function radius(d) {
        return d.population;
    }

    function color(d) {
        return d.region;
    }

    function key(d) {
        return d.name;
    }

    // Chart dimensions.
    var margin = {
        top: 29.5,
        right: 50,
        bottom: 19.5,
        left: 19.5
    };

    var width = parseInt(d3.select("#chart").style("width"), 10);
    width = width * 0.8;
    margin.left = width * 0.125;
    var height = 400 - margin.top - margin.bottom;


    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.linear().domain([0, 200]).range([0, width]),
        yScale = d3.scale.linear().domain([0, 100]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 3e8]).range([0, 47]),
        colorScale = d3.scale.ordinal().domain(["North", "South", "East", "West", "Northeast"]).range(["#566FDB", "#DBC256", "#DB5E56", "#56DB7F", "#DB56B2"]);
    // colorScale = d3.scale.category20c();

    // The x & y axes.
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
        yAxis = d3.svg.axis().scale(yScale).tickSize(width).orient("right");

    // Create the SVG container and set the origin.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .attr("transform", "translate(" + width + ", 0)")
    //     .call(yAxis);


    var gy = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    gy.selectAll("g").filter(function(d) {
            return d;
        })
        .classed("minor", true);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Infant Mortality Rate (per 1000 births)");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "start")
        // .attr("x", 25)
        .attr("y", -15)
        // .attr("dy", ".75em")
        // .attr("transform", "rotate(90)")
        .text("Literacy rate in %");


    gy.selectAll("text")
        .attr("x", 4)
        .attr("dy", -4);

    // Add the year label; the value is set on transition.
    var label = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "end")
        .attr("y", 80)
        .attr("x", width)
        .text(1971);

    // Load the data.
    d3.json("data/india.json", function(india) {

        // A bisector since many nation's data is sparsely-defined.
        var bisect = d3.bisector(function(d) {
            return d[0];
        });

        // Add a dot per nation. Initialize the data at 1971, and set the colors.
        var dot = svg.append("g")
            .attr("class", "dots")
            .selectAll(".dot")
            .data(interpolateData(1971))
            .enter().append("circle")
            .attr("class", "dot")
            .style("fill", function(d) {
                return colorScale(color(d));
            })
            .call(position)
            .sort(order);

        // adding tooltip
        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("color", "white")
            .style("padding", "8px")
            .style("background-color", "rgba(0, 0, 0, 0.75)")
            .style("border-radius", "6px")
            .style("font", "12px sans-serif")
            .text("tooltip");

        // // Add a title.
        // dot.append("title")
        //     .text(function(d) { return d.name; });


        dot
            .on("mouseover", function(d) {
                tooltip.text(d.name);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
                return tooltip.style("visibility", "hidden");
            });

        // Add an overlay for the year label.
        var box = label.node().getBBox();

        var overlay = svg.append("rect")
            .attr("class", "overlay")
            .attr("x", box.x)
            .attr("y", box.y)
            .attr("width", box.width)
            .attr("height", box.height)
            .on("mouseover", enableInteraction);

        // Start a transition that interpolates the data based on year.
        svg.transition()
            .duration(15000)
            .ease("linear")
            .tween("year", tweenYear)
            .each("end", enableInteraction);

        // Positions the dots based on data.
        function position(dot) {
            dot.attr("cx", function(d) {
                    return xScale(x(d));
                })
                .attr("cy", function(d) {
                    return yScale(y(d));
                })
                .attr("r", function(d) {
                    return radiusScale(radius(d));
                });
        }

        // Defines a sort order so that the smallest dots are drawn on top.
        function order(a, b) {
            return radius(b) - radius(a);
        }

        // After the transition finishes, you can mouseover to change the year.
        function enableInteraction() {
            var yearScale = d3.scale.linear()
                .domain([1971, 2012])
                .range([box.x + 10, box.x + box.width - 10])
                .clamp(true);

            // Cancel the current transition, if any.
            svg.transition().duration(0);

            overlay
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("mousemove", mousemove)
                .on("touchmove", mousemove);

            function mouseover() {
                label.classed("active", true);
            }

            function mouseout() {
                label.classed("active", false);
            }

            function mousemove() {
                displayYear(yearScale.invert(d3.mouse(this)[0]));
            }
        }

        // Tweens the entire chart by first tweening the year, and then the data.
        // For the interpolated data, the dots and label are redrawn.
        function tweenYear() {
            var year = d3.interpolateNumber(1971, 2012);
            return function(t) {
                displayYear(year(t));
            };
        }

        // Updates the display to show the specified year.
        function displayYear(year) {
            dot.data(interpolateData(year), key).call(position).sort(order);
            label.text(Math.round(year));
        }

        // Interpolates the dataset for the given (fractional) year.
        function interpolateData(year) {
            return india.map(function(d) {
                return {
                    name: d.name,
                    region: d.region,
                    infant_mortality: interpolateValues(d.infant_mortality, year),
                    population: interpolateValues(d.population, year),
                    literacy: interpolateValues(d.literacy, year)
                };
            });
        }

        // Finds (and possibly interpolates) the value for the specified year.
        function interpolateValues(values, year) {
            var i = bisect.left(values, year, 0, values.length - 1),
                a = values[i];
            if (i > 0) {
                var b = values[i - 1],
                    t = (year - a[0]) / (b[0] - a[0]);
                return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }
    });

}


function IMRvsMMR() {
    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) {
        return d.infant_mortality;
    }

    function y(d) {
        return d.maternal_mortality;
    }

    function radius(d) {
        return d.population;
    }

    function color(d) {
        return d.literacy;
    }

    function key(d) {
        return d.name;
    }

    // Chart dimensions.
    var margin = {
        top: 29.5,
        right: 50,
        bottom: 19.5,
        left: 19.5
    };

    var width = parseInt(d3.select("#chart2").style("width"), 10);
    width = width * 0.8;
    margin.left = width * 0.125;
    var height = 400 - margin.top - margin.bottom;

    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.linear().domain([0, 200]).range([0, width]),
        yScale = d3.scale.linear().domain([0, 600]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 3e8]).range([0, 40]),
        colorScale = d3.scale.linear().domain([42, 95]).range(["yellow", "red"]);
    // colorScale = d3.scale.category10();

    // The x & y axes.
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
        yAxis = d3.svg.axis().scale(yScale).tickSize(width).orient("right");

    // Create the SVG2 container and set the origin.
    var svg2 = d3.select("#chart2").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg2.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.

    // svg2.append("g")
    //     .attr("class", "y axis")
    //     .attr("transform", "translate(" + width + ", 0)")
    //     .call(yAxis);


    var gy = svg2.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    gy.selectAll("g").filter(function(d) {
            return d;
        })
        .classed("minor", true);

    // Add an x-axis label.
    svg2.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Infant Mortality Rate (per 1000 births)");

    // Add a y-axis label.
    svg2.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "start")
        // .attr("x", 25)
        .attr("y", -15)
        // .attr("dy", ".75em")
        // .attr("transform", "rotate(90)")
        .text("Maternal Mortality Ratio(per 100000 births)");


    gy.selectAll("text")
        .attr("x", 4)
        .attr("dy", -4);

    // Add the year label; the value is set on transition.
    var label2 = svg2.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "end")
        .attr("y", 80)
        .attr("x", width)
        .text(1997);

    // Load the data.
    d3.json("data/MMR.json", function(MMR) {

        // A bisector since many nation's data is sparsely-defined.
        var bisect = d3.bisector(function(d) {
            return d[0];
        });

        // Add a dot per nation. Initialize the data at 1997, and set the colors.
        var dot = svg2.append("g")
            .attr("class", "dots")
            .selectAll(".dot")
            .data(interpolateData(1997))
            .enter().append("circle")
            .attr("class", "dot")
            .call(position)
            .sort(order);

        // adding tooltip
        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("color", "white")
            .style("padding", "8px")
            .style("background-color", "rgba(0, 0, 0, 0.75)")
            .style("border-radius", "6px")
            .style("font", "12px sans-serif")
            .text("tooltip");

        // // Add a title.
        // dot.append("title")
        //     .text(function(d) { return d.name; });


        dot
            .on("mouseover", function(d) {
                tooltip.text(d.name);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function(d) {
                return tooltip.style("visibility", "hidden");
            });

        // Add an overlay for the year label.
        var box = label2.node().getBBox();

        var overlay = svg2.append("rect")
            .attr("class", "overlay")
            .attr("x", box.x)
            .attr("y", box.y)
            .attr("width", box.width)
            .attr("height", box.height)
            .on("mouseover", enableInteraction);

        // Start a transition that interpolates the data based on year.
        svg2.transition()
            .duration(8000)
            .ease("linear")
            .tween("year", tweenYear)
            .each("end", enableInteraction);

        // Positions the dots based on data.
        function position(dot) {
            dot.attr("cx", function(d) {
                    return xScale(x(d));
                })
                .attr("cy", function(d) {
                    return yScale(y(d));
                })
                .attr("r", function(d) {
                    return radiusScale(radius(d));
                })
                .style("fill", function(d) {
                    return colorScale(color(d));
                });
        }

        // Defines a sort order so that the smallest dots are drawn on top.
        function order(a, b) {
            return radius(b) - radius(a);
        }

        // After the transition finishes, you can mouseover to change the year.
        function enableInteraction() {
            var yearScale = d3.scale.linear()
                .domain([1997, 2009])
                .range([box.x + 10, box.x + box.width - 10])
                .clamp(true);

            // Cancel the current transition, if any.
            svg2.transition().duration(0);

            overlay
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("mousemove", mousemove)
                .on("touchmove", mousemove);

            function mouseover() {
                label2.classed("active", true);
            }

            function mouseout() {
                label2.classed("active", false);
            }

            function mousemove() {
                displayYear(yearScale.invert(d3.mouse(this)[0]));
            }
        }

        // Tweens the entire chart by first tweening the year, and then the data.
        // For the interpolated data, the dots and label are redrawn.
        function tweenYear() {
            var year = d3.interpolateNumber(1997, 2009);
            return function(t) {
                displayYear(year(t));
            };
        }

        // Updates the display to show the specified year.
        function displayYear(year) {
            dot.data(interpolateData(year), key).call(position).sort(order);
            label2.text(Math.round(year));
        }

        // Interpolates the dataset for the given (fractional) year.
        function interpolateData(year) {
            return MMR.map(function(d) {
                return {
                    name: d.name,
                    region: d.region,
                    infant_mortality: interpolateValues(d.infant_mortality, year),
                    population: interpolateValues(d.population, year),
                    maternal_mortality: interpolateValues(d.maternal_mortality, year),
                    literacy: interpolateValues(d.literacy, year)
                };
            });
        }

        // Finds (and possibly interpolates) the value for the specified year.
        function interpolateValues(values, year) {
            var i = bisect.left(values, year, 0, values.length - 1),
                a = values[i];
            if (i > 0) {
                var b = values[i - 1],
                    t = (year - a[0]) / (b[0] - a[0]);
                return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }
    });

}

function IMRsunburst() {
    var colors = {
        "Stillbirth": "lightblue",
        "EarlyNeonatal": "pink",
        "Neonatal": "gold",
        "Infant": "burlywood",
        "Urban 2006 - 2011": "lightblue",
        "Rural 2006 - 2011": "pink",
        "2006": "#F44336",
        "2007": "#BDBDBD",
        "2008": "#9E9E9E",
        "2009": "#757575",
        "2010": "#616161",
        "2011": "#424242"
    };

    var fullname = {
        "Stillbirth": "Still births",
        "EarlyNeonatal": "Early Neonatal Mortality Rate",
        "Neonatal": "Neonatal Mortality Rate",
        "Infant": "Infant Mortality Rate"
    };

    var subheader = {
        "Stillbirth": "Deaths per 1000 live births",
        "EarlyNeonatal": "First 7 days after birth",
        "Neonatal": "After 7 days till 30 days",
        "Infant": "After 1 month till 1 year"
    };

    var width = parseInt(d3.select("#chart3").style("width"), 10);

    var height = 500;
    var radius = (Math.min(width, height) / 2) - 10;
    var formatNumber = d3.format(",d");
    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    var y = d3.scale.sqrt()
        .range([0, radius]);
    var color = d3.scale.category20b();
    var partition = d3.layout.partition()
        .value(function(d) {
            return d.size;
        });
    var arc = d3.svg.arc()
        .startAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        })
        .innerRadius(function(d) {
            return Math.max(0, y(d.y));
        })
        .outerRadius(function(d) {
            return Math.max(0, y(d.y + d.dy));
        });


    var tooltip = d3.select("#chart3")
        .append("div")
        .attr("id", "tooltip3")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("color", "white")
        .style("padding", "8px")
        .style("background-color", "rgba(0, 0, 0, 0.75)")
        .style("border-radius", "6px")
        .style("font", "12px sans-serif")
        .style("visibility", "hidden");


    function format_name(d) {
        if (d.children) {
            if (d.name === "Infant Mortality Rate and Still births") {
                return "Infant Mortality Rate and Still births";
            } else if (d.name === "Urban 2006 - 2011" || d.name === "Rural 2006 - 2011") {
                return d.name;
            } else if (d.name === 2006 || d.name === 2007 || d.name === 2008 || d.name === 2009 || d.name === 2010 || d.name === 2011) {
                return d.name;
            } else {
                return '<b>' + "Infant Mortality Rate and Still births" + '</b><br>' + d.name + ' (' + d.parent.name + ') <br> Value: ' + formatNumber(d.value);
            }
        } else {
            return '<b>' + fullname[d.name] + '</b><br> Value: ' + formatNumber(d.value);
        }


        // var name = d.name;
        // return '<b>' + name + '</b><br> (' + format_number(d.value) + ')';
    }

    var svg = d3.select("#chart3").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    d3.json("data/sunburst.json", function(root) {
        // if (error) throw error;
        svg.selectAll("path")
            .data(partition.nodes(root))
            .enter().append("path")
            .attr("d", arc)
            .style("fill", function(d) {
                if (d.children) {
                    if (d.name === "Infant Mortality Rate and Still births") {
                        return "white";
                    } else if (d.name === "Urban 2006 - 2011" || d.name === "Rural 2006 - 2011") {
                        return colors[d.name];
                    } else {
                        return color(d.name);
                    }
                } else {
                    return colors[d.name];
                }
            })
            .on("click", click)
            .on("mouseover", function(d) {
                tooltip.html(function() {
                    var name = format_name(d);
                    return name;
                });
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return tooltip
                    .style("top", (d3.event.pageY - document.getElementById('inner-shell').offsetTop - 10) + "px")
                    .style("left", (d3.event.pageX - document.getElementById('inner-shell').offsetLeft + 10) + "px");

            })
            .on("mouseout", function() {
                return tooltip.style("visibility", "hidden");
            });

    });

    function click(d) {
        svg.transition()
            .duration(750)
            .tween("scale", function() {
                var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                    yd = d3.interpolate(y.domain(), [d.y, 1]),
                    yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                return function(t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                };
            })
            .selectAll("path")
            .attrTween("d", function(d) {
                return function() {
                    return arc(d);
                };
            });
    }


    d3.select(self.frameElement).style("height", height + "px");

}

function IMRvsID() {

    d3.json("data/InstitutionalDelivery.json", function(InstitutionalDelivery) {

        var chart;


        nv.addGraph(function() {
            chart = nv.models.scatterChart()
                .showDistX(true)
                .showDistY(true)
                .duration(300)
                .color(d3.scale.category10().range());

            chart.xAxis
                .axisLabel('% Institutional Deliveries').tickFormat(d3.format('.02f'));
            chart.yAxis
                .axisLabel('Infant Mortality Rate').tickFormat(d3.format('.02f'));

            d3.select('#chart4 svg')
                .datum(nv.log(InstitutionalDelivery))
                .call(chart);

            chart.tooltip.contentGenerator(function(d) {
                return '<p><span style="background-color:' + d.point.color + '; color:' + d.point.color + '">[[]]</span><span style="margin-left:5px; font-weight:600">' + d.point.z + '</span>' + '<span style="margin-left:5px">' + d.series[0].key + '</span> <p><p> Infant Mortality Rate: ' + d.point.y + '</p><p> % Institutional Deliveries: ' + d.point.x + ' </p>';
            });

            nv.utils.windowResize(chart.update);
            chart.dispatch.on('stateChange', function(e) {
                nv.log('New State:', JSON.stringify(e));
            });
            return chart;
        });
    });

}

function StatesOverview() {

    d3.json("data/states.json", function(states) {

        nv.addGraph(function() {

            var dim = dimensions();
            var chart = nv.models.parallelCoordinatesChart()
                .dimensionData(dim)
                .displayBrush(false)
                .lineTension(0.85);

            // var data = mydata();
            d3.select('#chart5 svg')
                .datum(nv.log(states))
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });
    });

    function dimensions() {
        return [{
            key: "Population Density",
            format: d3.format("d"),
            tooltip: "Population Density (Per Sq. Km.)",
        }, {
            key: "Sex Ratio",
            format: d3.format("d"),
            tooltip: "Sex Ratio (Females/ 1000 Males)",
        }, {
            key: "Literacy Rate (%)",
            format: d3.format("0.2f"),
            tooltip: "Total Literacy Rate (%)",
        }, {
            key: "Gender Gap in Literacy (%)",
            format: d3.format("0.2f"),
            tooltip: "Gender Gap in Literacy (%)",
        }, {
            key: "Infant Mortality Rate",
            format: d3.format("d"),
            tooltip: "Infant Mortality Rate (IMR) (per 1000 live births)",
        }, {
            key: "Households with latrine (%)",
            format: d3.format("0.1f"),
            tooltip: "Households with latrine facility within premises",
        }, {
            key: "Safe Drinking Water (%)",
            format: d3.format("0.1f"),
            tooltip: "Safe Drinking Water (Tap/Handpump/Tubewell) (%age)",
        }];
    }


}

IMRvsLiteracy();
IMRvsMMR();

IMRsunburst();

IMRvsID();
StatesOverview();

function IMRvsLiteracyReplay() {
    d3.select("#chart").select('svg').remove();
    IMRvsLiteracy();
}

function IMRvsMMRReplay() {
    d3.select("#chart2").select('svg').remove();
    IMRvsMMR();
}

function IMRsunburstReplay() {
    d3.select("#chart3").select('svg').remove();
    d3.select("#tooltip3").remove();
    IMRsunburst();
}

function resizeCharts() {
    IMRvsLiteracyReplay();
    IMRvsMMRReplay();
    IMRsunburstReplay();
}
