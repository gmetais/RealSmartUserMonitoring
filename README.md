Real Smart User Monitoring
==========================

Traditional real user monitoring? Please no!
Who cares about the average server response time? We want more, we want smarter data.

**DO NOT USE YET. Work in progress**
More details soon...

## Client installation

There are two ways to configure RSUM. You cannot mix these two technics.

### Add HTML parameters to the script's tag

```html
<script src="rsum.min.js" 
    data-rsum-host="http://mydomain.com:8383/rsum"
    data-rsum-sample="0.2"
    data-rsum-conversion="true"
></script>
```
All three parameters are optional.

### Set the global variable `RSUM_SETTINGS` **before** the script is loaded and executed.

```html
<script>
    window.RSUM_SETTINGS = {
        host: 'http://mydomain.com:8383/rsum',
        sample: 0.2,
        conversion: true
    }
</script>
...
<script src="rsum.min.js"></script>
```

### host (optional)

The RSUM server root (ex: "http://mydomain.com:8383/rsum").

### sample (optional)

The fraction of clients who should actually send data (0 > sample >= 1).

### conversion (optional)

Set this option to `true` only if you want the page to be a conversion page.
If you want to send the conversion event yourself in javascript, you can call the `RSUM.conversion()` function at any time after the page is loaded.


## Server installation

The server will read the /config/config.json file on startup. Edit this file to change the default config.

### debug

Enables debug mode

### websiteOrigin

Root URL of the website that will call RSUM. It must include the protocol (`http://` or `https://` but won't work with both for the moment).

### sessionTimeout

Duration of a user session (in minutes). After that time, a user coming back will be counted as a new user.

### mongoHost

Host of the MongoDB. Use `localhost` if it is on the same machine.

### mongoPort

Port of the MongoDB.


## TODO
 
 * Avoid browser compatibility errors and write a chapter in README about compatibility
 * Ignore search engines bots
 * Measure time in background ratio


## Release History

 * 2014-04-28   v0.1.0   initial release


## Author
Gaël Métais. I'm a webperf freelance based in Paris.
If you understand french, you can visit [my website](http://www.gaelmetais.com).