var BTCE = require('./btc-e.js');
var mongoClient = require('mongodb').MongoClient;

var MONGOHQ_URL="mongodb://nodejitsu:2a714a4c81707a77b8b5cad1ef44eb65@linus.mongohq.com:10050/nodejitsudb3696440756";
//var MONGOHQ_URL="mongodb://localhost:27017/dbp10";

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