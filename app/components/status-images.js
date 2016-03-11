import Ember from 'ember';
import { format as formatStatusImage } from 'travis/utils/status-image-formats';
import Config from 'travis/config/environment';

export default Ember.Component.extend({
  popup: Ember.inject.service(),
  auth: Ember.inject.service(),
  popupNameBinding: 'popup.popupName',

  id: 'status-images',
  attributeBindings: ['id'],
  classNames: ['popup', 'status-images'],
  types: ["Build Status", "Streak"],
  streakFormats: ['Image URL', 'Markdown', 'Textile', 'Rdoc', 'AsciiDoc', 'RST', 'Pod'],
  buildStatesFormats: ['Image URL', 'Markdown', 'Textile', 'Rdoc', 'AsciiDoc', 'RST', 'Pod', 'CCTray'],

  branches: function() {
    let repoId = this.get('repo.id'),
        popupName = this.get('popupName');

    if(popupName === 'status-images') {
      let array = Ember.ArrayProxy.create({ content: [] }),
          apiEndpoint = Config.apiEndpoint,
          options = {};

      array.set('isLoaded', false);

      if (this.get('auth.signedIn')) {
        options.headers = {
          Authorization: "token " + (this.auth.token())
        };
      }

      $.ajax(apiEndpoint + "/v3/repo/" + repoId + "/branches?limit=100", options).then(function(response) {
        if(response.branches.length) {
          array.pushObjects(response.branches.map((branch) => { return branch.name; }));
        } else {
          array.pushObject('master');
        }

        array.set('isLoaded', true);
      });

      return array;
    } else {
      // if status images popup is not open, don't fetch any branches
      return [];
    }
  }.property('popupName', 'repo'),

  actions: {
    close() {
      return this.get('popup').close();
    }
  },

  isStreak:  function() {
    return this.get('type') == 'Streak';
  }.property('type', 'repo.slug'),

  statusString: function() {
    let type   = this.get('type') || this.get('types.firstObject'),
        branch = this.get('branch') || 'master';
    var format;
    if (type == "Streak") {
      format = this.get('format') || this.get('streakFormats.firstObject');
    } else {
      format = this.get('buildStateFormat') || this.get('buildStatesFormats.firstObject');
    }

    return formatStatusImage(format, this.get('repo.slug'), branch, this.get('type'));
  }.property('streakFormat', 'buildStateFormats', 'repo.slug', 'branch', 'type', 'format')
});
