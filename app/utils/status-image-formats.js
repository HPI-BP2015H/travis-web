import { ccXml as ccXmlUrl, statusImage as statusImageUrl, streakImage as streakImageUrl } from 'travis/utils/urls';
var asciidocStatusImage, ccxmlStatusUrl, format, markdownStatusImage,
    podStatusImage, rdocStatusImage, rstStatusImage, textileStatusImage, urlRepo;

urlRepo = (function(slug) {
  return "https://" + location.host + "/" + slug;
});

markdownStatusImage = (function(url, imageURL, text) {
  return "[![" + text + "](" + imageURL + ")](" + url + ")";
});

textileStatusImage = (function(url, imageURL, text) {
  return "!" + imageURL + "!:" + url;
});

rdocStatusImage = (function(url, imageURL, text) {
  return "{<img src=\"" + imageURL + "\" alt=\"" + text + "\" />}[" + url + "]";
});

asciidocStatusImage = (function(url, imageURL, text) {
  return "image:" + imageURL + "[\"" + text + "\", link=\"" + url + "\"]";
});

rstStatusImage = (function(url, imageURL, text) {
  return ".. image:: " + imageURL + "\n    :target: " + url;
});

podStatusImage = (function(url, imageURL, text) {
  return "=for HTML <a href=\"" + url + "\"><img src=\"" + imageURL + "\"></a>";
});

ccxmlStatusUrl = (function(slug, branch) {
  return ccXmlUrl(slug, branch);
});

format = function(version, slug, branch, type) {
  var url, imageURL, text;
  url = urlRepo(slug);
  if (type == 'Streak') {
    imageURL = streakImageUrl(slug);
    text = 'Streak';
  } else {
    imageURL = statusImageUrl(slug, branch);
    text = 'Build Status';
  }
  switch (version) {
    case 'Image URL':
      return imageURL;
    case 'Markdown':
      return markdownStatusImage(url, imageURL, text);
    case 'Textile':
      return textileStatusImage(url, imageURL, text);
    case 'Rdoc':
      return rdocStatusImage(url, imageURL, text);
    case 'AsciiDoc':
      return asciidocStatusImage(url, imageURL, text);
    case 'RST':
      return rstStatusImage(url, imageURL, text);
    case 'Pod':
      return podStatusImage(url, imageURL, text);
    case 'CCTray':
      return ccxmlStatusUrl(slug, branch);
  }
};

export { format };
export default format;
