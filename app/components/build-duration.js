import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  data: {},

  load: function() {
    this.set("isLoading", true);
    var self = this;
    var apiEndpoint = config.apiEndpoint,
    repoId = this.get('repo.id'),
    options = {};

    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }

    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/build_duration", options)
    .then(function(response) {
      self.set("data", response);
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),

  draw: function() {
    var json = {
      "@type": "overview",
      "@href": "/v3/repo/HPI-BP2015H%2Fsqueak-parable/overview/build_time",
      "@representation": "standard",
      "build_time": [
        {
          "id": 491637,
          "number": "6000000",
          "state": "passed",
          "duration": 121
        },
        {
          "id": 490787,
          "number": "5000000",
          "state": "failed",
          "duration": 88
        },
        {
          "id": 491637,
          "number": "4000000",
          "state": "passed",
          "duration": 121
        },
        {
          "id": 490787,
          "number": "3000000",
          "state": "failed",
          "duration": 88
        },
        {
          "id": 491637,
          "number": "2000000",
          "state": "passed",
          "duration": 121
        },
        {
          "id": 490787,
          "number": "1000000",
          "state": "failed",
          "duration": 88
        }
      ]
    };

    var margin = {top: 20, right: 20, bottom: 40, left: 80},
    width = 400,
    height = 20 * json.build_time.length,
    fullWidth = width + margin.left + margin.right,
    fullHeight = height + margin.top + margin.bottom;

    var x = d3.scale.linear()
    .range([0,width]);

    var y = d3.scale.ordinal()
    .rangeRoundBands([0, height], 0.6);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .outerTickSize(0)
    .ticks(6);

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

    var svg = d3.select(".build-duration")
    .append("div")
    .attr("id", "build_duration_chart")
    .classed("svg-container", true)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
    .classed("svg-content-responsive", true)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain([0, d3.max(json.build_time, function(d) { return d.duration; })]);
    y.domain(json.build_time.map(function(d) { return d.number; }));

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("x", width)
    .attr("y", margin.bottom)
    .attr("dy", "-0.25em")
    .style("text-anchor", "end")
    .text("duration / s");

    var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    var yAxisLabel = yAxisGroup.append("text")
    .attr("x", -yAxis.tickSize()-yAxis.tickPadding())
    .attr("y", -margin.top)
    .attr("dy", "1em")
    .style("text-anchor", "end")
    .text("builds");

    svg.selectAll(".duration")
    .data(json.build_time)
    .enter()
    .append("rect")
    .attr("class", function(d) { return d.state; })
    .attr("x", 0)
    .attr("width", function(d) { return x(d.duration); })
    .attr("y", function(d) { return y(d.number); })
    .attr("height", y.rangeBand())
    .on("click", function(d) { console.log("Do Ember transition stuff. (with ID: " + d.id + ")"); } );
  }.property("repo", "isLoading")
});
