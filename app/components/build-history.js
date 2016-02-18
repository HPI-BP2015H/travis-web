import Ember from 'ember';
import d3 from 'd3';

export default Ember.Component.extend({
  didInsertElement: function() {
    var maxYTicks = 5;
    function cleanData(json) {
      var result = [];
      for(var date in json.recent_build_history) {
        var current = {
          date: (new Date(date)).toLocaleDateString(),
          passed: 0,
          // TODO: started
          failed: 0
          // TODO: errored
        };
        if(json.recent_build_history[date].passed) {
          current.passed = json.recent_build_history[date].passed;
        }
        if(json.recent_build_history[date].failed) {
          current.failed = json.recent_build_history[date].failed;
        }
        result.push(current);
      }
      return result;
    };

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
        '2015-02-11': {
          'failed': 1
        },
        '2007-02-10': {
          'passed': 1
        }
      }
    };

    //var data = cleanData(json);

    var data = [
      {
        date: '2015-02-16',
        passed: 3,
        started: 2,
        failed: 5,
      },
      {
        date: '2015-02-15',
        passed: 7,
        started: 2,
        failed: 2,
      },
      {
        date: '2015-02-14',
        passed: 11,
        started: 2,
        failed: 1,
      },
      {
        date: '2015-02-13',
        passed: 10,
        started: 0,
        failed: 3,
      },
      {
        date: '2015-02-12',
        passed: 19,
        started: 0,
        failed: 7,
      },
      {
        date: '2015-02-11',
        passed: 3,
        started: 0,
        failed: 5,
      },
      {
        date: '2015-02-10',
        passed: 7,
        started: 0,
        failed: 2,
      },
      {
        date: '2015-02-09',
        passed: 11,
        started: 0,
        failed: 1,
      },
      {
        date: '2015-02-08',
        passed: 10,
        started: 0,
        failed: 3,
      },
      {
        date: '2015-02-07',
        passed: 19,
        started: 0,
        failed: 7,
      }
    ];


    var margin = {top: 20, right: 20, bottom: 30, left: 40}
    , fullWidth = 1000
    , fullHeight = 200
    , marginWidth = fullWidth - margin.left - margin.right
    , marginHeight = fullHeight - margin.top - margin.bottom;

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
    //.attr("width", marginWidth + margin.left + margin.right)
    //.attr("height", marginHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.passed + d.failed; })]);

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

    svg.selectAll(".passed")
    .data(data)
    .enter().append("rect")
    .attr("class", "passed")
    .attr("x", function(d) { return x(d.date); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.passed); })
    .attr("height", function(d) { return marginHeight - y(d.passed); });

    svg.selectAll(".started")
    .data(data)
    .enter().append("rect")
    .attr("class", "started")
    .attr("x", function(d) { return x(d.date); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.started) + y(d.passed) - marginHeight; })
    .attr("height", function(d) { return marginHeight - y(d.started); });

    svg.selectAll(".failed")
    .data(data)
    .enter().append("rect")
    .attr("class", "failed")
    .attr("x", function(d) { return x(d.date); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) {
      return (
        y(d.failed)
        + y(d.started) - marginHeight
        + y(d.passed) - marginHeight);
      })
      .attr("height", function(d) { return marginHeight - y(d.failed); });
    }
  });
