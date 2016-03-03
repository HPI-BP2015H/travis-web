import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  data: {},
  allEvents: config.travisEvents,
  allStates: config.travisStatuses,

  convertData(json) {
    // ensures correct ordering of events
    var events = this.get("allEvents").filter(function(e) {
      return Object.keys(json.event_type).indexOf(e) > -1;
    });

    var statesFilter = function(i, e) {
      return Object.keys(json.event_type[events[i]]).indexOf(e) > -1;
    };

    var eventDict = {};
    for (var i = 0; i < events.length; i++) {
      // ensures correct ordering of states
      var states = this.get("allStates").filter(statesFilter.bind(undefined, i));
      var stateArray = [];
      var sum = 0;
      for (var j = 0; j < states.length; j++) {
        sum += json.event_type[events[i]][states[j]];
      }
      for (j = 0; j < states.length; j++) {
        if (json.event_type[events[i]][states[j]] > 0) {
          stateArray.push({
            state: states[j],
            count: json.event_type[events[i]][states[j]],
            percentage: (json.event_type[events[i]][states[j]] / sum) * 100
          });
        }
      }
      // only add to result if builds exist for this event type
      if (stateArray.length > 0) {
        eventDict[events[i]] = stateArray;
      }
    }
    return eventDict;
  },

  load: function() {
    // set flag to show loading indicator instead of drawing the chart
    this.set("isLoading", true);

    // remove old chart, in case of rerendering
    d3.selectAll("#event_type_chart").remove();

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
    // capitalizes words and turns special characters into spaces
    return (
      uglyName
      .split(/[_\W]/)
      .map(function(element, index, array) {
        return (
          element.charAt(0).toUpperCase() +
          element.substr(1)
        );
      }).join(" ")
    );
  },

  draw: function() {
    // another cleanup, just in case
    d3.selectAll("#event_type_chart").remove();

    var self = this,
    data = this.get("data"),
    events = Object.keys(data),
    fullWidth = 500,
    fullHeight = events.length === 3 ? 400 : 200; // smaller pane if fewer charts

    // set up pane
    var svg = d3.select(".event-type")
    .append("div")
    .attr("id", "event_type_chart")
    .classed("svg-container", true)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
    .classed("svg-content-responsive", true);

    // if only one event type: draw centered
    if (events.length === 1) {
      drawOnePie(svg, events[0], data[events[0]], {
        width: fullWidth / 2,
        height: fullHeight,
        x: fullWidth / 4,
        y: 0
      });
    }

    // if two event types: draw one left and one right
    if (events.length === 2) {
      drawOnePie(svg, events[0], data[events[0]], {
        width: fullWidth / 2,
        height: fullHeight,
        x: 0,
        y: 0
      });
      drawOnePie(svg, events[1], data[events[1]], {
        width: fullWidth / 2,
        height: fullHeight,
        x: fullWidth / 2,
        y: 0
      });
    }

    // if three event types: draw one centered
    // and the other two below the first (one left and one right)
    if (events.length === 3) {
      drawOnePie(svg, events[0], data[events[0]], {
        width: fullWidth / 2,
        height: fullHeight / 2,
        x: fullWidth / 4,
        y: 0
      });
      drawOnePie(svg, events[1], data[events[1]], {
        width: fullWidth / 2,
        height: fullHeight / 2,
        x: 0,
        y: fullHeight / 2
      });
      drawOnePie(svg, events[2], data[events[2]], {
        width: fullWidth / 2,
        height: fullHeight / 2,
        x: fullWidth / 2,
        y: fullHeight / 2
      });
    }

    function drawOnePie(svg, eventType, data, bBox) {
      var width = bBox.width,
      height = bBox.height,
      x = bBox.x,
      y = bBox.y,
      padding = 15,
      radius = Math.min(width-padding, height-padding) / 2;

      var arc = d3.svg.arc()
      .outerRadius(radius-10)
      .innerRadius(0);

      var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.count; });

      // center of the coordinate system to the center of the pie chart
      // translation with x and y to position pie chart on pane
      svg = svg.append("g")
      .attr("transform", "translate(" + x + "," + y + ")")
      .append("g")
      .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

      var header = svg.append("text")
      .attr("class", "pie-header")
      .text(self.beautifyEventType(eventType));

      header
      .attr("x", -header.node().getBBox().width/2)
      .attr("y", -height/2 + header.node().getBBox().height);

      // create group (one for each pie piece) for every data record
      // and move them down to give place to the header
      var g = svg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc")
      .attr("transform", "translate(" + 0 + "," + padding + ")");

      var piePieceMouseOver = function() {
        // create tooltip
        var text = d3.select(this).attr("hovertext");
        var x = d3.mouse(this)[0];
        var y = d3.mouse(this)[1];

        var labelGroup = svg.append("g")
        .attr("class", "label")
        .attr("id", "pie-label-id");

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

      var piePieceMouseOut = function() {
        // remove tooltip
        d3.selectAll("#pie-label-id").remove();
      };

      var piePieceMouseMove = function() {
        var labelGroup = d3.select("#pie-label-id");
        var x = d3.mouse(this)[0];
        var y = d3.mouse(this)[1];

        // reposition centered above mouse
        var offsetX = x - labelGroup.node().getBBox().width/2;
        var offsetY = y - labelGroup.node().getBBox().height/2 - 5;
        labelGroup.attr("transform", "translate(" + offsetX + "," + offsetY + ")");
      };

      // add content to pre-created groups
      var piePieces = g.append("path")
      .attr("d", arc)
      .attr("class", function(d) { return d.data.state + " pie-piece"; })
      .attr("hovertext", function(d) {
        return   d.data.count +
        " "  + d.data.state +
        " (" + d.data.percentage.toFixed(2) + "%)";
      });

      piePieces
      .on("mouseover", piePieceMouseOver)
      .on("mouseout" , piePieceMouseOut)
      .on("mousemove", piePieceMouseMove);

    }
  }.property("repo", "isLoading")
});
