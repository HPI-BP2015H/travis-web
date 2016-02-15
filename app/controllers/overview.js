import Ember from 'ember';
import GithubUrlPropertievs from 'travis/mixins/github-url-properties';
import config from 'travis/config/environment';

export default Ember.Controller.extend({
  repoController: Ember.inject.controller('repo'),
  repoBinding: 'repoController.repo',

  defaultBranch: function() {
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
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "?include=repository.default_branch,build.commit", options).then(function(response) {
      response.default_branch.repository.id = response.id;
      return result.set('content', Ember.Object.create(response.default_branch));
    });
    return result;
  }.property('repo')

});
