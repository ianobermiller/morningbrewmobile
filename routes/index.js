var request = require('request');
var FeedParser = require('feedparser');
var moment = require('moment');
var cheerio = require('cheerio');

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
            art.link = article.origlink;
            art.commentLink = article.comments;

            // Add text links for each linked article/site
            // If there is more than one link in an element, number them to disambiguate
            var $ = cheerio.load(article.description);
            $('p, li').each(function() {
                var $parent = $(this);
                var $as = $parent.find('a');
                var count = $as.length;
                var textLinks = [];
                $as.each(function(i, el) {
                    var $a = $(el);
                    $a.addClass('normal-link');
                    var url = $a.attr('href');
                    textLinks.push('<a class="text-link" href="http://viewtext.org/article?url=' + url + '">text ' + (count > 1 ? (i + 1) : '') + '</a>');
                    if (count > 1) {
                        $a.after('<sup>' + (i + 1) + '</sup')
                    }
                });
                if (textLinks.length > 0) {
                    $parent.prepend('<div class="text-links">' + textLinks.join('') + '</div>');
                }
            });

            art.html = $.html();

            data.articles.push(art);
        })
        .on('end', function() {
            data.articles = data.articles.slice(0, 5);
            lastData = data;
            lastDataTime = Date.now();
            res.render('index', data);
        });
};