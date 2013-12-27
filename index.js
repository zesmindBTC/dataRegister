var http = require('http');
var BTCE = require('./btc-e.js');
var mongo = require('mongodb');
var url = require('url');
var mongoClient = require('mongodb').MongoClient;
var async = require('async');

//var MONGOHQ_URL="mongodb://nodejitsu:de9720a1df0ff9ea226b0d60eaa61459@linus.mongohq.com:10032/nodejitsudb5735702882";
var MONGOHQ_URL="mongodb://localhost:27017/b10";

mongoClient.connect(MONGOHQ_URL, function(error, db) {
	"use strict";

		(function(){
		var btcePublic = new BTCE();

		db.collection('trades', function(err,collection){
		collection.ensureIndex({'tid':1}, function(){});
		collection.ensureIndex({'date':1}, function(){})
		});


		/*var dbDepth = function(callback) { btcePublic.depth("btc_usd", function(err, data) {
				if (!err) {
					try{
						callback(err,data);
					}
					catch (err) {

						}
				}

				});};*/


		var dbTrades0 = function () {btcePublic.trades("btc_usd", function(err, data) {
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
						});};

		var dbTrades = function(callback) {btcePublic.trades("btc_usd", function(err, data) {
				if (!err) {
					try{
						callback(err,data);
					}
					catch (err) {

						}
				}

				});};


		
		var dbTicker = function(callback) {btcePublic.ticker("btc_usd", function(err, data) {
				if (!err) {
					try{
						callback(err,data);
					}
					catch (err) {

						}
				}

				});};

		var dbDepthTime = function(err,result) {
				var aTime = result[0].ticker.server_time;
				var resul = {};

				resul.timeServer = aTime;

				if (!err) {
					try{
						Trades = result[1];
						Trades.forEach(function(a){
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
		};

		setInterval(function () {
			async.parallel([
			    dbTicker,
			    dbTrades],
				dbDepthTime);
			dbTrades();
		},5000)})();
});