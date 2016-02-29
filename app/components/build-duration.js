import Ember from 'ember';
import d3 from 'd3';
import TravisRoute from 'travis/routes/basic';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  routing: Ember.inject.service("-routing"),
  isLoading: true,
  json: {},

  cleanUp: function() {
    d3.select("#build_duration_chart").remove();
  }.property("repo", "isLoading"),

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
      self.set("json", response);
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),

  draw: function() {
    var self = this;
    var json = this.get("json");

    var margin = {top: 20, right: 20, bottom: 40, left: 80},
    width = 400,
    height = 20 * json.build_duration.length,
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

    d3.select("#build_duration_chart").remove();

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

    x.domain([0, d3.max(json.build_duration, function(d) { return d.duration; })]);
    y.domain(json.build_duration.map(function(d) { return d.number; }));

    svg.append("g")
    .attr("class", "build-duration axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("x", width)
    .attr("y", margin.bottom)
    .attr("dy", "-0.25em")
    .style("text-anchor", "end")
    .text("duration / s");

    var yAxisGroup = svg.append("g")
    .attr("class", "build-duration axis")
    .call(yAxis);

    var yAxisLabel = yAxisGroup.append("text")
    .attr("x", -yAxis.tickSize()-yAxis.tickPadding())
    .attr("y", -margin.top)
    .attr("dy", "1em")
    .style("text-anchor", "end")
    .text("builds");

    svg.selectAll(".duration")
    .data(json.build_duration)
    .enter()
    .append("rect")
    .attr("class", function(d) { return d.state; })
    .attr("x", 0)
    .attr("width", function(d) { return x(d.duration); })
    .attr("y", function(d) { return y(d.number); })
    .attr("height", y.rangeBand())
    .on("click", function(d) {
      self.get("routing").transitionTo("build", [d.id]);
    });
  }.property("repo", "isLoading")
});
