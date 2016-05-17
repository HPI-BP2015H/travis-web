import Ember from 'ember';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  classNames: ['streak-row'],

  getStreakData: function() {
    var result, apiEndpoint, options, repoId;
    apiEndpoint = config.apiEndpoint;
    repoId = this.get('repo.id');
    result = Ember.ObjectProxy.create();
    options = {};
    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/streak", options).then(function(response) {
      return result.set('content', Ember.Object.create(response));
    });
    return result;
  }.property('repo')

});
