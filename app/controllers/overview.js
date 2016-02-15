import Ember from 'ember';
import GithubUrlPropertievs from 'travis/mixins/github-url-properties';
import config from 'travis/config/environment';

export default Ember.Controller.extend({
  repoController: Ember.inject.controller('repo'),
  repoBinding: 'repoController.repo',

  defaultBranch: function() {
    var result, apiEndpoint, options, repoId, branchName;
    apiEndpoint = config.apiEndpoint;
    repoId = this.get('repo.id');
    branchName = this.get('repo.defaultBranch.name');
    result = Ember.ObjectProxy.create();
    options = {};
    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/branch/" + branchName + "?include=build.commit", options).then(function(response) {
      return result.set('content', Ember.Object.create(response));
    });
    return result;
  }.property('repo')

});
