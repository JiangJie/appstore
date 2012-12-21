var t1 = new Date().getTime();

var $ = require('jquery'),
	request = require('request'),
	async = require('async'),
	fs = require('fs');

var TOP = 25;

var fetchApps = function(device, type, top, cb, er) {
	var TYPE_INDEX = {
		free: 0,
		paid: 1,
		grossing: 2
	};
	request.get({
		url: 'http://d.cocoachina.com/brand/index/' + device,
		proxy: 'http://proxy.tencent.com:8080'
	}, function(err, res, body) {
		if(err) {
			er(err);
		} else {
			var $right_block = $('.right_block', body)[1];
			var $inner_con = $('.inner_con', $right_block)[TYPE_INDEX[type]];
			var $app_frame = $('.app_frame', $inner_con);
			var $h4a = $('h4 a', $app_frame);
			var len = $h4a.length;
			(top > len) && (top = len);
			$h4a.splice(top);
			$h4a = $.map($h4a, function(item, index) {
				return {name: item.title, href: item.href, order: index + 1}
			});
			async.map($h4a, function(item, callback) {
				request.get({
					url: item.href,
					proxy: 'http://proxy.tencent.com:8080'
				}, function(err, res, body) {
					if(err) {
						callback(err);
					} else {
						var company = ($('.app_info p a', body)[0] && $('.app_info p a', body)[0].innerHTML) || '';
						var category = ($('.sheet_frame table th', body)[2] && $('.sheet_frame table th', body)[2].innerHTML) || '';
						var app = {order: item.order, name: item.name, company: company, category: category};
						callback(null, app);
					}
				});
			}, function(err, result) {
				if(err) {
					er(err);
				} else {
					cb(result);
				}
			});
		}
	});
};
var fillData = function(device, type, cb) {
	fetchApps(device, type, TOP, function(result) {
		data[device] || (data[device] = {});
		data[device][type] = result;
		cb(null);
	}, function(err) {
		cb(err);
	});
};
var data = {};
async.parallel([
	function(cb) {
		fillData('iphone', 'free', cb);
	},
	function(cb) {
		fillData('iphone', 'paid', cb);
	},
	function(cb) {
		fillData('iphone', 'grossing', cb);
	},
	function(cb) {
		fillData('ipad', 'free', cb);
	},
	function(cb) {
		fillData('ipad', 'paid', cb);
	},
	function(cb) {
		fillData('ipad', 'grossing', cb);
	}
], function(err, result) {
	if(err) {
		console.log(err);
	} else {
		fs.writeFile('result.json', JSON.stringify(data), function() {
			console.log('写入文件完成');
			var t2 = new Date().getTime();
			console.log('用时：' + (t2 - t1) + 'ms');
		});
	}
});