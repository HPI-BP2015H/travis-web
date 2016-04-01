## Travis CI ember web client
[![Build Status](https://travis-ci.org/travis-ci/travis-web.png?branch=master)](https://travis-ci.org/travis-ci/travis-web)
### Running the app

The app is developed using [Ember CLI](http://ember-cli.com). It requires [Node.js](https://nodejs.org) with npm installed.

In order to run the app you need to install dependencies with:

    npm install -g ember-cli
    npm install -g bower
    bower install
    npm install

Now you can run the server:

    ember serve

And open http://localhost:4200 in the browser.

Alternatively you can run `ember build --watch` and start the server with `waiter/script/server`

### Running the app in private repos mode

At the moment Travis CI is available as two separate sites - https://travis-ci.org for Open Source
projects and https://travis-ci.com for private projects. travis-web will connect
to the Open Source version by default. In order to connect it to the API for private projects
you need to run:

```
TRAVIS_PRO=true ember serve --ssl --ssl-key=ssl/server.key --ssl-cert=ssl/server.crt
```

One caveat here is that the command will start server with SSL, so the page will
be accessible at https://localhost:4200 (note `https` part).

### Running on SSL in general

Sometimes there is a need to test the app with an SSL connection. This is required
to make Pusher work when running Travis CI Pro, but it may also be needed in other
situations.

There's already an SSL certificate in the `ssl` directory, which is set for `localhost`
host. If you want to use it, you can start the server with:

```
ember serve --ssl --ssl-key=ssl/server.key --ssl-cert=ssl/server.crt
```

In case you want your own certificate, you can follow the instructions posted
here: https://gist.github.com/trcarden/3295935 and then point the server to your
certificate with `--ssl-key` and `--ssl-cert`.

### Running tests

First you have to install PhantonJS:

    npm install -g phantomjs

To run a test suite execute:

    ember test

You can also start an interactive test runner for easier development:

    ember test --serve


### Updating the team page

The team information can be found in `app/routes/team.js`.
To add another member just add the info in the same style as the previous ones. Like so

    {
      name: 'Mr T'
      title: 'Mascot'
      handle: 'travisci'
      nationality: 'internet'
      country: 'internet'
      image: 'mrt'
    }

The order of value pairs does not matter, the quotationmarks do. Name and title will be displayed as they are. The handle will be used to generate a link to Twitter and displayed with a '@' in front of it. Nationality and country determine the flags. Please use the name of the country and not the adjective (like 'germany' and NOT 'german'). Image is the identifier to find the right image and animated gif. 'mrt' in the example will result in `team-mrt.png` and `mrt-animated.gif`.
Add the images themselves to `public/images/team/` and additional flags to `public/images/pro-landing/`. Mind the naming conventions already in place.
