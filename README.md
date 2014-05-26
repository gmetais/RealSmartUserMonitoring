Real Smart User Monitoring
==========================

Traditional real user monitoring? Please no!
Who cares about the average server response time? We want more, we want smarter data.

**DO NOT USE YET. Work in progress**

More details soon...

## Client installation

There are two ways to configure RSUM. You cannot mix these two methods.

### Method 1

Add HTML parameters to the script's tag

```html
<script src="rsum.min.js" 
    data-rsum-host="http://mydomain.com:8383/rsum"
    data-rsum-session-timeout="120"
    data-rsum-sample="0.2"
    data-rsum-conversion="true"
></script>
```

All three parameters are optional.

### Method 2

Set the global variable `RSUM_SETTINGS` **before** the script is loaded and executed.

```html
<script>
    window.RSUM_SETTINGS = {
        host: 'http://mydomain.com:8383/rsum',
        sessionTimeout: 120,
        sample: 0.2,
        conversion: true
    }
</script>
...
<script src="rsum.min.js"></script>
```

### Settings details

#### host (optional)

The RSUM server root (ex: "http://mydomain.com:8383/rsum"). Default value is `/rsum`.

#### session timeout (optional)

The duration of a session in minutes. Default value is `120` minutes.

#### sample (optional)

The fraction of clients who should actually send data (0 > sample >= 1). Default value is 1`.

#### conversion (optional)

Set this option to `true` only if you want the page to be a conversion page. Default value is false.
If you want to send the conversion event yourself in javascript, you can call the `RSUM.conversion()` function at any time after the page is loaded.


## Server installation

### 1 - Install Elasticsearch

You will need an elasticsearch instance. It can be hosted on the same machine as the server.
Don't worry, it's pretty easy to install, just follow [this guide](http://www.elasticsearch.org/overview/elasticsearch#installation).


### 2 - Install the RSUM package with npm

```shell
npm install rsum -g
```


### 3 - Edit the config file

The server will read the `/config/config.json` file on startup. Edit this file to change the default config.

#### debug

Enables debug mode

#### websiteOrigin

Root URL of the website that will call RSUM. It must include the protocol (`http://` or `https://` but won't work with both for the moment).

#### sessionTimeout

Duration of a user session (in minutes). After that time, a user coming back will be counted as a new user.

#### elasticsearchHost

Elasticsearch REST API path. If you installed it on the same machine with the default port, use `http://localhost:9200`.


### 4 - Launch the server

(todo)


## TODO
 
 * Create a "UX score" for each user, by calculating the frustration on each page he visits and making the sum of frustration
 * Avoid browser compatibility errors and write a chapter in README about compatibility
 * Ignore search engines bots
 * Measure time in background ratio
 * Give access to the UX score client-side, so the website can make some optimizations (example: remove ads when user has a bad user experience)


## Release History

 * 2014-04-28   v0.1.0   initial release


## Author
Gaël Métais. I'm a webperf freelance based in Paris.
If you understand french, you can visit [my website](http://www.gaelmetais.com).