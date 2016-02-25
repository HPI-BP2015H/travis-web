import Ember from 'ember';
import d3 from 'd3';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  isLoading: true,
  json: {},

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

    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/build_time", options)
    .then(function(response) {
      self.set("json", response);
      self.set("isLoading", false);
    });
    return "";
  }.property("repo"),
});
