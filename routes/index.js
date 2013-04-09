var request = require('request');
var FeedParser = require('feedparser');
var moment = require('moment');

var expirationInMilliseconds =  1 * 60 * 60 * 1000; // 1 hour 

var lastData = null;
var lastDataTime = null;

exports.index = function(req, res){
    if (lastData && (Date.now() - lastDataTime) < expirationInMilliseconds) {
        return res.render('index', lastData);
    }

    var data = { title: 'Morning Brew Mobile', articles: [] };
    request('http://blog.cwa.me.uk/feed/')
        .pipe(new FeedParser())
        .on('error', function(error) {
            console.log('error', error);
        })
        .on('meta', function(meta) {
            data.date = meta.date;
        })
        .on('article', function(article) {
            var art = {};
            art.title = article.title;
            art.date = moment(article.date).format('MMMM Do YYYY');
            art.html = article.description;
            art.html = art.html.replace(/<a href="(.*?)">.*?<\/a>/g, '<a class="text-link" href="http://viewtext.org/article?url=$1">Text</a> $&');
            data.articles.push(art);
        })
        .on('end', function() {
            data.articles = data.articles.slice(0, 5);
            lastData = data;
            lastDataTime = Date.now();
            res.render('index', data);
        });
};