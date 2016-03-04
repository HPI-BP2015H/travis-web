import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  json: {},
  statuses: config.travisStatuses,

  load: function() {
    // set flag to show loading indicator instead of drawing the chart
    this.set("isLoading", true);

    // remove old chart, in case of rerendering
    d3.select("#build_history_chart").remove();

    var self = this;
    var apiEndpoint = config.apiEndpoint,
    repoId = this.get('repo.id'),
    options = {};

    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }

    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/build_history", options)
    .then(function(response) {
      // set json to empty array if there are no data
      if (Object.keys(response.recent_build_history).length === 0) {
        this.set("json", []);
      } else {
        self.set("json", self.cleanData(response));
      }
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),

  cleanData(json) {
    var daysToDisplay = 10;
    var result = [];
    // for each day starting today and going in the past
    for(var i=0; i<daysToDisplay; i++) {
      // create object with status variables set to zero
      var current = {};
      for (var j = 0; j < this.get("statuses").length; j++) {
        current[this.get("statuses")[j]] = 0;
      }

      // create current dayStrings
      var day = new Date();
      day.setDate(day.getDate()-i);
      var dayStringISO = day.toISOString().substring(0,10);
      var dayStringLocale = day.toLocaleDateString("en-US", {
        month: 'short',
        day: '2-digit'
      });
      current['date'] = dayStringLocale;

      // if dayStringISO in json: update status variables
      if (dayStringISO in json.recent_build_history) {
        for (j = 0; j < this.get("statuses").length; j++) {
          if(this.get("statuses")[j] in json.recent_build_history[dayStringISO]) {
            current[this.get("statuses")[j]] = json.recent_build_history[dayStringISO][this.get("statuses")[j]];
          }
        }
      }
      // append to result
      result.push(current);
    }
    return result;
  },

  draw: function() {

    // abort drawing if there are no data
    if (this.get("json").length === 0) {
      return "<span class=\"no-builds-caption\">No builds in last 10 days.</h2>";
    }

    var self = this;

    // to avoid too many ticks
    function yTicks(data) {
      var maxBuilds = 0;
      var maxYTicks = 10;
      for (var i = 0; i < data.length; i++) {
        var builds = data[i].passed + data[i].failed;
        if (builds > maxBuilds) {
          maxBuilds = builds;
        }
      }
      return maxBuilds <= maxYTicks ? maxBuilds : maxYTicks;
    }

    function drawChart(data) {
      // another cleanup, just in case
      d3.selectAll("#build_history_chart").remove();

      // margin for axes
      var margin = {top: 20, right: 20, bottom: 30, left: 60},
      fullWidth = 1000,
      fullHeight = 200,
      marginWidth = fullWidth - margin.left - margin.right,
      marginHeight = fullHeight - margin.top - margin.bottom;

      var x = d3.scale.ordinal()
      .rangeRoundBands([0, marginWidth], 0.1);

      var y = d3.scale.linear()
      .range([marginHeight, 0]);

      var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

      var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(yTicks(data));

      // set up pane
      var svg = d3.select(".build-history")
      .append("div")
      .attr("id", "build_history_chart")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // map x axis to last 10 days
      // map y axis to 0 to maximum number of builds on a single day
      x.domain(data.map(function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) {
        var result = 0;
        for (var i = 0; i < self.get("statuses").length; i++) {
          result += d[self.get("statuses")[i]];
        }
        return result;
      })]);

      // add x axis
      svg.append("g")
      .attr("class", "build-history x axis")
      .attr("transform", "translate(0," + marginHeight + ")")
      .call(xAxis);

      // add y axis
      svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(90)")
      .attr("y", 30)
      .attr("x", 0.5*marginHeight)
      .attr("dy", "1.5em")
      .style("text-anchor", "middle")
      .text("builds");

      // helper function to prevent loosing the focus
      d3.selection.prototype.moveToFront = function() {
        return this.each(function() {
          this.parentNode.appendChild(this);
        });
      };

      // helper functions to avoid defintion in loop
      var xAttr = function(d) {
        return x(d.date);
      };

      var yAttr = function(d) {
        var result = y(d[self.get("statuses")[i]]);
        for (var j = 0; j < drawnStatuses.length; j++) {
          result += y(d[drawnStatuses[j]]) - marginHeight;
        }
        return result;
      };

      var heightAttr = function(d) {
        var result = marginHeight - y(d[self.get("statuses")[i]]);
        result = result > 0 ? result + 1 : 0; // to avoid white lines
        return result;
      };

      var hovertext = function(d) {
        return d[self.get("statuses")[i]] + " " + self.get("statuses")[i];
      };

      var barMouseOver = function() {
        var labelOffset = 5;
        var x = parseFloat(d3.select(this).attr("x"));
        var y = parseFloat(d3.select(this).attr("y"));
        var height = parseFloat(d3.select(this).attr("height"));
        var width = parseFloat(d3.select(this).attr("width"));
        var text = d3.select(this).attr("hovertext");

        // create shadow around bars
        var shadowGroup = svg.append("g")
        .attr("class", "bar-shadow")
        .attr("id", "bar-shadow-id");

        var shadowRect = shadowGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", x)
        .attr("y", y);

        // create label next to the bar
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

        // position label
        // (usually on the right side but left if right is out of screen)
        var labelTranslationX = x + width + labelOffset;
        var labelTranslationY = y + 0.5*height - 0.5*labelRect.attr("height");
        if (labelTranslationX + parseFloat(labelRect.attr("width")) > marginWidth) {
          labelTranslationX = x - labelRect.attr("width") - labelOffset;
        }

        labelGroup
        .attr("transform", "translate(" + labelTranslationX + ", " + labelTranslationY + ")");

        // move current bar to front to avoid z fighting effects
        d3.select(this).moveToFront();
      };

      var barMouseOut = function() {
        // remove label and shadow
        svg.selectAll("#bar-label-id").remove();
        svg.selectAll("#bar-shadow-id").remove();
      };

      // add bars for every status
      var drawnStatuses = [];
      for (var i = 0; i < self.get("statuses").length; i++) {
        svg.selectAll("." + self.get("statuses")[i])
        .data(data)
        .enter().append("rect")
        .attr("class", self.get("statuses")[i])
        .attr("x", xAttr)
        .attr("width", x.rangeBand())
        .attr("y", yAttr)
        .attr("height", heightAttr)
        .attr("hovertext", hovertext)
        .on("mouseover", barMouseOver)
        .on("mouseout", barMouseOut);

        drawnStatuses.push(self.get("statuses")[i]);
      }

      return "";
    }
    return drawChart(self.get("json"));
  }.property("repo", "isLoading")
});
