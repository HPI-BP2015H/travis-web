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

});
