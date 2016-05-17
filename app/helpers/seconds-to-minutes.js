import Ember from "ember";

export default Ember.Helper.helper(function(seconds) {
  return Math.round(seconds / 60);
});
