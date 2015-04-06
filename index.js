var _ = require('underscore');
var log = require('nodeutil').simplelog;
var mysql = require('mysql');

//0: sequence loop, 1: random choice
var select_strategy = 0;

exports.setDbSelectStrategy = function(value) {
  select_strategy = value;
}

var master = {
  config:[],
  instances:[],
  curr_idx:0
};

var slave = {
  config:[],
  instances:[],
  curr_idx:0
};

exports.addMaster = function(ip, port, opts) {
  opts.host = ip;
  opts.port = port;
  master.config.push(opts);   
  master.instances.push(mysql.createPool(opts));
}

exports.addSlave = function(ip, port, opts) {
  opts.host = ip;
  opts.port = port;
  slave.config.push(opts);   
  slave.instances.push(mysql.createPool(opts));
}

exports.pool = {
  query: query
}

function query(sql, opts, callback) {
  if(sql.toLowerCase().indexOf('select') >= 0) {
    //using read only pool
    if(typeof(opts) == 'function') {
      return getPool('slave').query(sql, opts);
    } else {
      return getPool('slave').query(sql, opts, callback);
    }
  } else {
    // using read write pool
    if(typeof(opts) == 'function') {
      return getPool('master').query(sql, opts);
    } else {
      return getPool('master').query(sql, opts, callback);
    }
  }
}

function getPool(type) {
  var db = (type == 'master') ? master: slave;
  
  if(select_strategy == 0) {
    //sequence get
		db.curr_idx++;
		db.curr_idx = db.curr_idx % db.instances.length;
    log.debug('using %s pool[%s]', type, db.curr_idx);
    return db.instances[db.curr_idx];
  } else {
    //random get
    var idx = _.random(0, db.instances.length - 1);
    log.debug('using %s pool[%s]', type, idx);
    return db.instances[idx];
  }
}

