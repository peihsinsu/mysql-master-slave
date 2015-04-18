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

exports.pools = {
	master: master, 
	slave: slave
}

exports.addMaster = function(ip, port, opts) {
  opts.host = ip;
  opts.port = port;
  opts.idx = master.config.length;
  master.config.push(opts);   
  master.instances.push(mysql.createPool(opts));
}

exports.addSlave = function(ip, port, opts) {
  opts.host = ip;
  opts.port = port;
  opts.idx = slave.config.length;
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
	if(slave.instances.length <= 0) type = 'master';
  var db = (type == 'master') ? master: slave;
  
  if(select_strategy == 0) {
    //sequence get
		db.curr_idx++;
		db.curr_idx = db.curr_idx % db.instances.length;
    log.trace('using %s pool[%s]', type, db.curr_idx);
    return db.instances[db.curr_idx];
  } else {
    //random get
    var idx = _.random(0, db.instances.length - 1);
    log.trace('using %s pool[%s]', type, idx);
    return db.instances[idx];
  }
}

function getPoolConnection(type) {
  if(slave.instances.length <= 0) type = 'master';
  var db = (type == 'master') ? master: slave;
  
  if(select_strategy == 0) {
    //sequence get
    db.curr_idx++;
    db.curr_idx = db.curr_idx % db.instances.length;
    log.trace('using %s pool[%s]', type, db.curr_idx);
    var cfg = db.config[db.curr_idx];
    return mysql.createConnection(cfg);
  } else {
    //random get
    var idx = _.random(0, db.instances.length - 1);
    log.trace('using %s pool[%s]', type, idx);
    // return db.instances[idx];
    var cfg = db.config[idx];
    return mysql.createConnection(cfg);
  }
}

exports.beginTransaction = function() {
  var tx = {
    jobs:[],
    rollback_state: {
      ROLLBACK: 'rollback',
      PASS_ROLLBACK: 'pass_rollback'
    },
    addJob: function(sql, cond, callback) {
      this.jobs.push({
        sql: sql,
        cond: cond,
        callback: callback
      })
    },
    exec: function(callback) {
      var connection = getPoolConnection('master');
      var tx_result = [];
      // pool.getConnection(function(err, connection) {
        // if(err) {
        //   console.log('get connection error:', err);
        //   throw err;
        // }
        var jobs = reverseArr(this.jobs);

        log.trace('got jobs:', jobs);

        connection.beginTransaction(function(err) {
          if (err) { 
            console.log('begin transaction error:', err);
            //throw err; 
            if(!callback)
              throw err;
            else
              callback(err, result)
          }

          doJob();
          
          function doJob() {
            var job = jobs.pop();
            log.debug('exec job:', job);
            connection.query(job.sql, job.cond, function(err, result){
              log.debug('[SQL]', job.sql);
              log.debug('[Cond]', job.cond);

              //execute job callback, default will rollback error process
              var is_rollback = job.callback(err, result, connection) == 'pass_rollback' ? false : true ;
              if (err && is_rollback) { 
                return connection.rollback(function() {
                  //throw err;
                  if(!callback)
                    throw err;
                  else {
                    connection.end();
                    callback(err, tx_result);
                  }
                });
              }

              var r = {
                job: job, result: result
              }
              if(!is_rollback) {
                r['error'] = err;
                r['pass_rollback'] = true; 
              }
              tx_result.push(r);

              if(jobs.length > 0) {
                doJob();
              } else {
                connection.commit(function(err) {
                  if (err && is_rollback) { 
                    connection.rollback(function() {
                      //throw err;
                      if(!callback)
                        throw err;
                      else
                        callback(err, result)
                    });
                  }
                  log.trace('transaction commited...');
                  connection.end();
                  if(callback)
                    callback(err, tx_result)
                });
              }
            });
          }
        });
      // });
    },
  }

  return tx;
}

function reverseArr(arr) {
  var result = [];
  while(arr.length > 0) {
    result.push(arr.pop());
  }
  return result;
}

