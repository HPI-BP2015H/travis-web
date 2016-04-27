import Ember from 'ember';
import d3 from 'd3';
import TravisRoute from 'travis/routes/basic';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  routing: Ember.inject.service("-routing"),
  isLoading: true,
  json: {},

  load: function() {
    // set flag to show loading indicator instead of drawing the chart
    this.set("isLoading", true);

    // remove old chart, in case of rerendering
    d3.select("#build_duration_chart").remove();

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

  avg(json) {
    var sum = 0;
    for(var i=0; i<json.build_duration.length; i++) {
      sum += json.build_duration[i].duration;
    }
    return sum / json.build_duration.length;
  },

  draw: function() {
    // another cleanup, just in case
    d3.select("#build_duration_chart").remove();

    var self = this;
    var json = this.get("json");

    // margin for axes
    var margin = {top: 30, right: 20, bottom: 30, left: 60},
    height = 200,
    width = 1000,
    fullWidth = width + margin.left + margin.right,
    fullHeight = height + margin.top + margin.bottom;

    var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.6);

    var y = d3.scale.linear()
    .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .outerTickSize(0);

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .outerTickSize(0)
    .ticks(6);

    // set up pane
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

    // map x axis to build numbers (not ids)
    // map y axis to 0 to maximum duration
    x.domain(json.build_duration.map(function(d) { return d.number; }));
    y.domain([0, d3.max(json.build_duration, function(d) { return d.duration; })]);

    // add x axis
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
    .text("builds");

    // add y axis
    var yAxisGroup = svg.append("g")
    .attr("class", "build-duration axis")
    .call(yAxis);

    var yAxisLabel = yAxisGroup.append("g")
    .attr("class", "axis-label")
    .append("text")
    .attr("x", -margin.left)
    .attr("y", -margin.top)
    .attr("dy", "1.0em")
    .text("duration / s");

    yAxisLabel.attr("dx", yAxisLabel.node().getBBox().width);

    var barMouseOver = function() {
      // create tooltip
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

      // position centered above mouse
      var offsetX = x - labelGroup.node().getBBox().width/2;
      var offsetY = y - labelGroup.node().getBBox().height/2 - 5;
      labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
    };

    var barMouseOut = function() {
      // remove tooltip
      d3.selectAll("#bar-label-id").remove();
    };

    var barMouseMove = function() {
      var labelGroup = d3.select("#bar-label-id");
      var x = d3.mouse(this)[0];
      var y = d3.mouse(this)[1];

      // reposition centered above mouse
      var offsetX = x - labelGroup.node().getBBox().width/2;
      var offsetY = y - labelGroup.node().getBBox().height - 5;
      labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
    };

    // for each build: draw bar
    svg.selectAll(".duration")
    .data(json.build_duration)
    .enter()
    .append("rect")
    .attr("class", function(d) { return d.state; })
    .attr("x", function(d) { return x(d.number); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return height-y(d.duration); })
    .attr("height", function(d) { return y(d.duration); })
    .attr("hovertext", function(d) {
      return "#" + d.number + " (" + d.state + "): " + d.duration + "s";
    })
    // on click: transition to build page
    .on("click", function(d) {
      self.get("routing").transitionTo("build", [d.id]);
    })
    .on("mouseover", barMouseOver)
    .on("mouseout" , barMouseOut )
    .on("mousemove", barMouseMove);

    // draw average line
    svg.append("svg:line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", height-y(self.avg(json)))
    .attr("y2", height-y(self.avg(json)))
    .attr("class", "duration-avg");

  }.property("repo", "isLoading")
});
