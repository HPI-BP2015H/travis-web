import Ember from 'ember';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  classNames: ['streak-row'],
  isLoading: true,
  streak: {},
  history: {},

  load: function() {
    var apiEndpoint, options, repoId, self, streakLoaded, historyLoaded;
    streakLoaded = false;
    historyLoaded = false;
    self = this;
    self.set("isLoading", true);

    apiEndpoint = config.apiEndpoint;
    repoId = this.get('repo.id');
    options = {};
    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/streak", options).then(function(response) {
      self.set("streak", response.streak);
      if(historyLoaded) {
        self.set("isLoading", false);
      } else {
        streakLoaded = true;
      }
    });
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/history", options).then(function(response) {
      console.log
      self.set("history", response.history);
      if(streakLoaded) {
        self.set("isLoading", false);
      } else {
        historyLoaded = true;
      }
    });
    return "";
  }.property('repo')

});
