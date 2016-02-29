import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  data: {},

  convertData(json) {
    var events = Object.keys(json.event_type);
    var eventDict = {};
    for(var i=0; i<events.length; i++) {
      var states = Object.keys(json.event_type[events[i]]);
      var stateArray = [];
      var sum = 0;
      for(var j=0; j<states.length; j++) {
        sum += json.event_type[events[i]][states[j]];
      }
      for(var j=0; j<states.length; j++) {
        if(json.event_type[events[i]][states[j]] > 0) {
          stateArray.push({
            state: states[j],
            count: json.event_type[events[i]][states[j]],
            percentage: (json.event_type[events[i]][states[j]] / sum) * 100
          });
        }
      }
      if(stateArray.length > 0) {
        eventDict[events[i]] = stateArray;
      }
    }
    return eventDict;
  },

  cleanUp: function() {
    d3.selectAll("#event_type_chart").remove();
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

    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/event_type", options)
    .then(function(response) {
      self.set("data", self.convertData(response));
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),

  beautifyEventType(uglyName) {
    return (
      uglyName
      .split(/[_\W]/)
      .map(function(element, index, array) {
        return (
          element.substr(0,1).toUpperCase() +
          element.substr(1,element.length-1));
      }).join(" "));
  },

  draw: function() {
    d3.selectAll("#event_type_chart").remove();

    var self = this;
    var data = this.get("data");
    var events = Object.keys(data);
    var fullWidth = 600;
    var fullHeight = 250;

    var svg = d3.select(".event-type")
    .append("div")
    .attr("id", "event_type_chart")
    .classed("svg-container", true)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
    .classed("svg-content-responsive", true);

    for(var i=0; i<events.length; i++) {
      drawOnePie(svg, events[i], data[events[i]], i);
    }

    function drawOnePie(svg, eventType, data, position) {
      var width = fullWidth/3,
      height = fullHeight,
      x = position * width,
      y = 0,
      radius = Math.min(width, height) / 2;

      var arc = d3.svg.arc()
      .outerRadius(radius-10)
      .innerRadius(0);

      var labelArc = d3.svg.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

      var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.count; });

      svg = svg
      .append("g")
      .attr("transform", "translate(" + x + "," + y + ")")
      .append("g")
      .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

      var header = svg.append("text")
      .attr("class", "pie-header")
      .text(self.beautifyEventType(eventType));

      header
      .attr("x", -width/2 + 5)
      .attr("y", -height/2 + header.node().getBBox().height);

      var g = svg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

      var piePieceMouseOver = function() {
        var text = d3.select(this).attr("hovertext");
        var x = d3.mouse(this)[0];
        var y = d3.mouse(this)[1];

        var labelGroup = svg.append("g")
        .attr("class", "bar-label");

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

        var offsetX = x - labelGroup.node().getBBox().width - 5;
        var offsetY = y - labelGroup.node().getBBox().height - 5;
        labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
      };

      var piePieceMouseOut = function() {
        d3.selectAll(".bar-label").remove();
      };

      var piePieceMouseMove = function() {
        var labelGroup = d3.select(".bar-label");
        var x = d3.mouse(this)[0];
        var y = d3.mouse(this)[1];

        var offsetX = x - labelGroup.node().getBBox().width - 5;
        var offsetY = y - labelGroup.node().getBBox().height - 5;
        labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
      };

      var piePieces = g.append("path")
      .attr("d", arc)
      .attr("class", function(d) { return d.data.state + " pie-piece"; })
      .attr("hovertext", function(d) {
        return   d.data.count
        + " "  + d.data.state
        + " (" + d.data.percentage.toFixed(2) + "%)";
      });

      piePieces
      .on("mouseover", piePieceMouseOver)
      .on("mouseout" , piePieceMouseOut)
      .on("mousemove", piePieceMouseMove);

    }
  }.property("repo", "isLoading")
});
