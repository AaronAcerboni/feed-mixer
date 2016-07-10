# feed-mixer

feed-mixer is a module which transforms multiple rss/atom feed sources into 
a rss or atom feed.

It can be a single method use module or it can poll data to a specified time 
and 

```
npm install feed-mixer
```

# usage

```javascript
var FeedMixer = require('./src/feed-mixer');

var mixer = new FeedMixer({
    "title": "My aggregate feed",
    "description": "This feed is made up of many.",
    "link": "http://example.com",
    "output": "rss-2.0",
    "feeds": [
        "https://www.youtube.com/feeds/videos.xml?user=vsauce",
        "https://twitrss.me/twitter_user_to_rss/?user=tweetsauce"
    ]
});

// Pattern A

mixer.refresh().then(function (feed) {
    fs.writeFileSync("output.rss", feed);
});

// Pattern B

mixer.on('refreshComplete', function (feed) {
    fs.writeFileSync("output.rss", feed);
});

mixer.refresh();
```

### API

#### FeedMixer(config)

Returns a FeedMixer object

```javascript
var mixer = new FeedMixer({
    "title": "My aggregate feed",
    "description": "This feed is made up of many.",
    "link": "http://example.com",
    "output": "rss-2.0",
    "feeds": [
        "https://www.youtube.com/feeds/videos.xml?user=vsauce",
        "https://twitrss.me/twitter_user_to_rss/?user=tweetsauce"
    ]
})
```


#### FeedMixer(configSource)

Returns a FeedMixer object with a config specified to JSON source.

```javascript
var mixer = new FeedMixer('./config.json')
```

#### FeedMixer.refresh()

Returns a promise of which the callback argument is a string of the 
aggregate feed.

This function works by requesting all the feeds specified in the url and 
then aggregating them into one feed.

```javascript
mixer.refresh().then(function (feed) {
    require('fs').writeFileSync('aggregate.rss', feed);
});
```

#### FeedMixer.aggregate

Returns a traversable option of the aggregate feed

```javascript
mixer.aggregate.length
```

#### FeedMixer.getFeed(feedFormatType)

Returns a string version of the aggregate feed.

`feedFormatType` is either `"rss-2.0"` or `"atom-1.0"`.
Defaults to the config output type.

```javascript
var feedString = mixer.getFeed('atom-1.0');
```

#### FeedMixer.end()
#### FeedMixer.finish()

Stop the automatic polling/refreshing of the aggregate feed.

```javascript
mixer.end();
```


### config options

Config is either supplied in the constructor argument or as a 
resource string to a JSON file.

```
{
    name:        Your aggregate feed name
    description: Your aggregate feed description
    link:        Your aggregate feed url
    output:      Your aggregate feed in "rss-2.0" or "atom-1.0" format
    update:      (Optional) How often to refresh (hh:mm:ss format)
}
```

### Events
#### FeedMixer.events.on('refreshStart')

Event called when the `refresh()` method is called. 
Argument passed is the `Date` of refresh.

```javascript
mixer.events.on('refreshStart', function (when) {
    console.log('Started fetching/aggregating at ', when);
});
```

#### FeedMixer.events.on('refreshCompleted')

Event called when aggregate feed is ready and `FeedMixer.aggregate` 
property is updated.

Argument passed is the string of the aggregate feed in either the 
rss or atom format.

```javascript
var latestFeedVersion;

mixer.events.on('refreshComplete', function (feed) {
    latestFeedVersion = feed;
});
```