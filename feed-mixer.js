// Dependencies

var fs           = require('fs');         // Used to read config.json
var Q            = require('q');          // Promise library
var EventEmitter = require('events');
var request      = require('request');    // Used for basic http requests
var FeedParser   = require('feedparser'); // Used for handling requested feeds
var Feed         = require('feed');       // Used for building aggregate feed
var util         = require('./src/util'); // Used to parse aspects of config.json

// App API

module.exports = Mixer;

// App

function Mixer (config) {
    var that = this;
    if (typeof config === 'string') {
        this.config = JSON.parse(fs.readFileSync(config, 'utf8'));
    } else {
        this.config = config;
    }

    // Mixer events interface
    this.events = new EventEmitter();
 
    // Refresh every {{config.update}}, call mixer.finish/end() to cancel
    if (this.config.update) {
        this.polling = setInterval(function () {
            that.refresh();
        }), util.configTimeToMs(this.config.update))
    }
}

Mixer.prototype = {
    aggregate: null,

    finish: function () {
        this.end();
    },

    end: function () {
        clearInterval(this.polling);
    },

    getFeed: function (type) {
        return this.aggregate.render(type || this.config.output);
    },

    refresh: function () {
        var that     = this;
        var deferred = Q.defer(),
            // Data structure for the total aggregate feed
            aggregate = new Feed({
                "title": this.config.title,
                "description": this.config.description,
                "link": this.config.link
            }),
            // Promise array representing all feeds when been parsed
            feedsParsed = [];

        this.config.feeds.forEach(function (url) {
            feedsParsed.push(parseFeed(url));
        })

        // Render the aggregate feed when all feeds are parsed
        Q.all(feedsParsed)
        .then(sortByDate)
        .then(function (items) {
            var rendered;
            items.forEach(function (item) {
                aggregate.addItem({
                    title: item.title,
                    description: item.description,
                    link: item.link,
                    author: [{name:item.author}],
                    date: item.date
                });
            });
            that.aggregate = aggregate;
            rendered       = aggregate.render(that.config.type);
            that.events.emit('refreshComplete', rendered);
            deferred.resolve(rendered);
        });

        this.events.emit('refreshStart', new Date());
        
        return deferred.promise;
    },
    
}

function parseFeed (url) {
    var deferred = Q.defer();
    var items    = [];

    var parser = new FeedParser()
        .on('error', function () {
            console.log('Feedparser error: ' + url);
        })
        .on('readable', function () {
            items.push(this.read());
        })
        .on('end', function () {
            deferred.resolve(items);
        });

    request(url)
        .on('error', function () {
            console.log('Request error fetching: ' + url);
        })
        .on('response', function (res) {
            this.pipe(parser);
        });

    return deferred.promise;
}

function sortByDate (feedItems) {
    var deferred  = Q.defer();
    var flattened = feedItems.reduce(function (a, b) {
        return a.concat(b);
    })
    
    flattened.sort(function (a, b) {
        return new Date(a.date).getTime() > new Date(b.date).getTime();
    });

    deferred.resolve(flattened);
    return deferred.promise;
}