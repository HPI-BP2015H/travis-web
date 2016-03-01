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
    .append("g")
    .attr("class", "axis-label")
    .append("text")
    .attr("x", width)
    .attr("y", margin.bottom)
    .attr("dy", "-0.25em")
    .style("text-anchor", "end")
    .text("duration / s");

    var yAxisGroup = svg.append("g")
    .attr("class", "build-duration axis")
    .call(yAxis);

    var yAxisLabel = yAxisGroup.append("g")
    .attr("class", "axis-label")
    .append("text")
    .attr("x", -yAxis.tickSize()-yAxis.tickPadding())
    .attr("y", -margin.top)
    .attr("dy", "1em")
    .style("text-anchor", "end")
    .text("builds");

    var barMouseOver = function() {
      var text = d3.select(this).attr("hovertext");
      var x = d3.mouse(this)[0];
      var y = d3.mouse(this)[1];

      var labelGroup = svg.append("g")
      .attr("class", "label")
      .attr("id", "bar-label-id");

      var labelRect = labelGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0);

      var labelText = labelGroup.append("text")
      .attr("x", 10)
      .attr("y", 5)
      .attr("dy", "1em")
      .text(text);

      labelRect
      .attr("height", labelText.node().getBBox().height + 10)
      .attr("width", labelText.node().getBBox().width + 20);

      var offsetX = x - labelGroup.node().getBBox().width/2;
      var offsetY = y - labelGroup.node().getBBox().height - 5;
      labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
    };

    var barMouseOut = function() {
      d3.selectAll("#bar-label-id").remove();
    };

    var barMouseMove = function() {
      var labelGroup = d3.select("#bar-label-id");
      var x = d3.mouse(this)[0];
      var y = d3.mouse(this)[1];

      var offsetX = x - labelGroup.node().getBBox().width/2;
      var offsetY = y - labelGroup.node().getBBox().height - 5;
      labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
    };

    svg.selectAll(".duration")
    .data(json.build_duration)
    .enter()
    .append("rect")
    .attr("class", function(d) { return d.state; })
    .attr("x", 0)
    .attr("width", function(d) { return x(d.duration); })
    .attr("y", function(d) { return y(d.number); })
    .attr("height", y.rangeBand())
    .attr("hovertext", function(d) {
      return "#" + d.number + " (" + d.state + "): " + d.duration + "s";
    })
    .on("click", function(d) {
      self.get("routing").transitionTo("build", [d.id]);
    })
    .on("mouseover", barMouseOver)
    .on("mouseout" , barMouseOut )
    .on("mousemove", barMouseMove);
  }.property("repo", "isLoading")
});
