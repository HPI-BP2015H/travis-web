import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  data: {},

  convertData(json) {
    var events = Object.keys(json.event_type_data);
    var eventDict = {};
    for(var i=0; i<events.length; i++) {
      var states = Object.keys(json.event_type_data[events[i]]);
      var stateArray = [];
      for(var j=0; j<states.length; j++) {
        if(json.event_type_data[events[i]][states[j]] > 0) {
          stateArray.push({
            state: states[j],
            count: json.event_type_data[events[i]][states[j]]
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
    // TODO
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

    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/event_type_data", options)
    .then(function(response) {
      self.set("data", self.convertData(response));
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),

  draw: function() {
    var data = this.get("data");
    console.log(data);
    var events = Object.keys(data);
    console.log(events);
    for(var i=0; i<events.length; i++) {
      drawOnePie(events[i], data[events[i]]);
    }

    function drawOnePie(eventType, data) {
      var width = 400,
      height = 200,
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

      var svg = d3.select(".event-type")
      .append("div")
      .attr("id", "event_type_chart") // TODO: Is it okay to give one id to many divs?
      .attr("class", "eventType")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + width + " " + height)
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

      var g = svg.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

      var piePieceMouseEnter = function() {
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

      var piePieceMouseLeave = function() {
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
      .attr("hovertext", function(d) { return d.data.state; });

      piePieces
      .on("mouseenter", piePieceMouseEnter)
      .on("mouseleave", piePieceMouseLeave)
      .on("mousemove" , piePieceMouseMove );

    }
  }.property("repo", "isLoading")
});
