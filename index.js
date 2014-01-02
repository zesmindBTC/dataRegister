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

        var currentTimeServer = -1;
        var lastCandelTimeClose = -1;

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


            var newCandel = function(candelLapseSeconds) {
                var starTimeCandel;
                var endTimeCandel;
                //si es la primera vez que se ejecuta
                if (lastCandelTimeClose ===-1) lastCandelTimeClose = currentTimeServer;
                if ((currentTimeServer-lastCandelTimeClose)>= candelLapseSeconds){
                  //si estuvo mucho tiempo sin operar puede estar desactualiada "lastCandelTimeclose"
                    if ((currentTimeServer-lastCandelTimeClose)>= 2*candelLapseSeconds) (lastCandelTimeClose = currentTimeServer);
                    createCandel(lastCandelTimeClose,lastCandelTimeClose+candelLapseSeconds);
                };
                };

            var createCandel = function (dateStar,dateEnd){
                var collectionTrades = db.collection("trades");
                var candel = {};

                collectionTrades.find({"date": {$lt:dateStar, $gte:dateEnd}},function(err,result){
                    var openPrice= 0;
                    var closePrice=0;
                    var minPrice=0;
                    var maxPrice=0;
                    var avgPrice=0;
                    var avgAmountPrice=0;
                    var transactions=0;
                    var volumeBTC=0;
                    if (!err) {
                        openPrice = result[0].price;
                        closePrice = result[result.length-1];
                        transactions = result.length;
                        minPrice = result[0].price;
                        maxPrice = result[0].price;

                        result.forEach(function(a){
                            avgPrice += a.price;
                            avgAmountPrice += a.price * a.amount;
                            volumeBTC += a.amount;
                            if (a.price < minPrice) (minPrice = a.price);
                            if (a.price > maxPrice)(maxPrice = a.price);
                        });

                        avgPrice = avgPrice/transactions;
                        avgAmountPrice = avgAmountPrice/volumeBTC;


                        candel.timeOpen = dateStar;
                        candel.timeClose = dateEnd;
                        candel.openPrice = openPrice;
                        candel.closePrice = closePrice;
                        candel.minPrice = minPrice;
                        candel.maxPrice = maxPrice;
                        candel.avgPrice = avgPrice;
                        candel.avgAmountPrice = avgAmountPrice;
                        candel.transactions = transactions;
                        candel.volumeBTC = volumeBTC;

                        if (maxPrice > 0) {
                            return  candel;
                        }
                        else{
                            return null;
                        }
                    }
                    else {
                        return null;
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
						var time_server = result[1].ticker.server_time;
						var tradesBatch = result[0];
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