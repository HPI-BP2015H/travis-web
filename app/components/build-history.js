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
          failed: 0
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
        date: '2015-02-11',
        passed: 3,
        failed: 5,
      },
      {
        date: '2015-02-10',
        passed: 7,
        failed: 2,
      },
      {
        date: '2015-02-09',
        passed: 11,
        failed: 1,
      }
      ,
      {
        date: '2015-02-08',
        passed: 10,
        failed: 3,
      }
      ,
      {
        date: '2015-02-07',
        passed: 19,
        failed: 7,
      }
    ];


    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.1);

    var y = d3.scale.linear()
    .range([height, 0]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(yTicks(data));

    var svg = d3.select(".build-history").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.passed + d.failed; })]);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
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
    .attr("height", function(d) { return height - y(d.passed); });

    svg.selectAll(".failed")
    .data(data)
    .enter().append("rect")
    .attr("class", "failed")
    .attr("x", function(d) { return x(d.date); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.failed) + y(d.passed) -height; })
    .attr("height", function(d) { return height - y(d.failed); });
  }
});
