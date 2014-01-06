var http = require('http');
var BTCE = require('./btc-e.js');
var mongo = require('mongodb');
var url = require('url');
var mongoClient = require('mongodb').MongoClient;
var async = require('async');

//var MONGOHQ_URL="mongodb://nodejitsu:de9720a1df0ff9ea226b0d60eaa61459@linus.mongohq.com:10032/nodejitsudb5735702882";
var MONGOHQ_URL="mongodb://localhost:27017/b201";

mongoClient.connect(MONGOHQ_URL, function(error, db) {
	"use strict";

		(function(){
		var btcePublic = new BTCE();

		db.collection('trades', function(err,collection){
		collection.ensureIndex({'tid':1}, function(){});
		collection.ensureIndex({'date':1}, function(){})
		});


		var dbTrades = function() {btcePublic.trades("btc_usd", function(err, data) {
				if (!err) {
					try{
                        data.forEach(function(a){
                            db.collection('trades', function(err,collection){
                                if (!err) {
                                    collection.findOne({'tid':a.tid}, function(err, result) {
                                        if (!err) {
                                            if (!result) {
                                                collection.insert(a, function(){});
                                                //console.log(a.tid);
                                            } else {
                                                //console.log('SI HAY, tid:' + a.tid);
                                            }
                                        }
                                    });
                                }
                            });
                        });
					}
					catch (err) {

						}
				}

				});
        };

		setInterval(dbTrades,3000);
        })();
});