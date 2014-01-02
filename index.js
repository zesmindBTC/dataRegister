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

		var tradeSave = function(arrayTrades) {
			arrayTrades.forEach(function(a){
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

		};

		var currentTimeServer = -1;

		var newCandel = function(currentTimeServer, candelLapseSeconds) {
			//verifico el ultimo time del ultimo candel.
			db.collection('candels',function(err,collection){
				if (!err) { 
							collection.findOnes({},{ sort:[['timeServerClose',-1]]}, function(err, result) {
								if (!err) { 
										if (!result) {
											//si el tiempo transcurrido es mayor o igual a candelLapseSeconds creo una nueva candela.
											if ((currentTimeServer-result.timeServerClose)>=candelLapseSeconds) {
												db.collection('trades',function(err,collection){
                                                    if (!err){
                                                            var dateStar = result.timeServerClose;
                                                            var dateEnd = result.timeServerClose + candelLapseSeconds;
                                                            var candel = {};
                                                            db.find({"date": {$lt:dateStar, $gte:dateEnd}},function(err,result){
                                                                if (!err) {

                                                                    candel.timeOpen = dateStar;
                                                                    candel.timeClose = dateEnd;
                                                                    candel.openPrice;
                                                                    candel.closePrice;
                                                                    candel.minPrice;
                                                                    candel.maxPrice;
                                                                    candel.avgPrice;
                                                                    candel.avgAmountPrice;
                                                                    candel.transactions;
                                                                    candel.volumeBTC;
                                                                }
                                                                else {}
                                                           });
                                                    }
                                                    else{

                                                    }
                                                });
											}
												
										} else {
												//console.log('SI HAY, tid:' + a.tid);
												}
											}
							});
						   }

			});

		};


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

		var ejecutarCiclo = function(err,result) {
				if (!err) {
					try{
						var time_server = result[0].ticker.server_time;
						var tradesBatch = result[1];
						if (time_server > currentTimeServer) currentTimeServer = time_server; 
						
						//Tengo que levantar el tiempo de la ultima candela y fijarme si se cumplio el periodo
						async.serie([
							tradeSave(tradesBatch),
							newCandel(currentTimeServer,60)
							]);
					}
					catch (err) {

						}
				}
		};

		setInterval(function () {
			async.parallel([
			    dbTrades,
			    dbTicker],
				ejecutarCiclo);
			dbTrades();
		},5000)})();
});