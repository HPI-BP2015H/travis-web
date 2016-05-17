import Ember from "ember";

export default Ember.Helper.helper(function(params) {
  // appends a letter "s" to suffix if count > 1 and composes count and suffix
  // example: {{suffix 1  "build"}} -> "1 build"
  // example: {{suffix 2 "day"}} -> "2 days"
  let count  = params[0];
  let suffix = params[1];
  return count.toString() + " " + suffix + (count > 1 ? "s" : "");
});
