import Ember from 'ember';
import config from 'travis/config/environment';

export default Ember.Component.extend({
  classNames: ['branch_table'],

  repo_branches: function() {
    return ['master', 'pharo']
  }.property('repo'),

  getBranchData: function() {
    var result, apiEndpoint, options, repoId;
    apiEndpoint = config.apiEndpoint;
    repoId = this.get('repo.id');
    result = Ember.ArrayProxy.create();
    options = {};
    if (this.get('auth.signedIn')) {
      options.headers = {
        Authorization: "token " + (this.auth.token())
      };
    }
    $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/overview/branches", options).then(function(response) {
      var array = [];
      for(var branchname in response.branches){
        array.push(Ember.Object.create({branchname: branchname, percentage: Math.round(100*response.branches[branchname])}));
      };
      array.sort(function(a, b){
        return a.branchname>b.branchname;
      });
      result.set('count', array.length);
      result.set('content', array);
      return result;
    });
    return result;
  }.property('repo')

});
