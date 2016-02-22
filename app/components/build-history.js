import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  didInsertElement: function() {
    var maxYTicks = 5;
    var daysToDisplay = 10;
    var statuses = [
      'passed',
      'started',
      'queued',
      'booting',
      'received',
      'created',
      'failed',
      'errored',
      'canceled'
    ];

    function apiQuery(caller) {
      var apiEndpoint = config.apiEndpoint,
      repoId = caller.get('repo.id'),
      options = {};

      if (caller.get('auth.signedIn')) {
        options.headers = {
          Authorization: "token " + (caller.auth.token())
        };
      }

      $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/build_history", options)
      .then(function(response) {
        //drawChart(cleanData(response));
        drawChart(cleanData(json));
      });
    }

    function cleanData(json) {
      var result = [];
      // for each day starting today and going in the past
      for(var i=0; i<daysToDisplay; i++) {
        // create object with status variables set to zero
        var current = {};
        for(var j=0; j<statuses.length; j++) {
          current[statuses[j]] = 0;
        }

        // create current dayStrings
        var day = new Date();
        day.setDate(day.getDate()-i);
        var dayStringISO = day.toISOString().substring(0,10);
        var dayStringLocale = day.toLocaleDateString();
        current['date'] = dayStringLocale;

        // if dayStringISO in json: update status variables
        if(dayStringISO in json.recent_build_history) {
          for(j=0; j<statuses.length; j++) {
            if(statuses[j] in json.recent_build_history[dayStringISO]) {
              current[statuses[j]] = json.recent_build_history[dayStringISO][statuses[j]];
            }
          }
        }

        // append to result
        result.push(current);
      }
      return result;
    }

    function yTicks(data) {
      var maxBuilds = 0;
      for(var i = 0; i < data.length; i++) {
        var builds = data[i].passed + data[i].failed;
        if(builds > maxBuilds) {
          maxBuilds = builds;
        }
      }
      var result = maxBuilds <= maxYTicks ? maxBuilds : maxYTicks;
      return result;
    }

    var json = {
      "@type": "overview",
      "@href": "/v3/repo/#{repo.id}/overview/build_history",
      "@representation": "standard",
      "recent_build_history": {
        '2016-02-22': {
          'failed': 1,
          'started': 1,
          'queued': 1,
          'canceled': 2
        },
        '2016-02-20': {
          'passed': 1,
          'failed': 2,
          'errored': 3
        }
      }
    };

    apiQuery(this);

    function drawChart(data) {
      var margin = {top: 20, right: 20, bottom: 30, left: 40},
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

      var svg = d3.select(".build-history")
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(data.map(function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) {
        var result = 0;
        for(var i=0; i<statuses.length; i++) {
          result += d[statuses[i]];
        }
        return result;
      })]);

      svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + marginHeight + ")")
      .call(xAxis);

      svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("builds");

      var drawnStatuses = [];
      for(var i=0; i<statuses.length; i++) {
        svg.selectAll("." + statuses[i])
        .data(data)
        .enter().append("rect")
        .attr("class", statuses[i])
        .attr("x", function(d) { return x(d.date); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) {
          var result = y(d[statuses[i]]);
          for(var j=0; j<drawnStatuses.length; j++) {
            result += y(d[drawnStatuses[j]]) - marginHeight;
          }
          return result;
        })
        .attr("height", function(d) { return marginHeight - y(d[statuses[i]]); });

        drawnStatuses.push(statuses[i]);
      }
    }
  }
});
