MySQL Master Slave
====

This module is depend on mysql module for build the master, slave database environment. 

## Installation

```
npm install mysql-master-slave
```

## Usage Sampple:

```
var cluster = require('mysql-master-slave');

var opts = {
  connectionLimit : 10,
  user: 'your-user',
  password: 'your-password',
  database: 'sampledb'
}

cluster.addMaster('your-mysql-server', '3306', opts);
cluster.addMaster('your-mysql-server', '3306', opts);
cluster.addSlave('your-mysql-server', '3306', opts);
cluster.addSlave('your-mysql-server', '3306', opts);
cluster.addSlave('your-mysql-server', '3306', opts);

var sql = 'insert into test123 (create_date) values (?)';

for(var i = 0 ; i < 10 ; i++)
cluster.pool.query(sql, [new Date()], function(err, r, f){
  if(err) {
    console.log('Error:', err);
  }

  console.log('Result:', r);
  process.exit(0);
});
```

Execution result:

```
node test.js
[2015-04-06 09:31:26.424] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.431] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.432] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.433] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.434] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.436] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.437] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.437] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.438] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:31:26.439] [DEBUG] [default] - [index.js - query] using master pool...
Result: { fieldCount: 0,
  affectedRows: 1,
  insertId: 40,
  serverStatus: 2,
  warningCount: 0,
  message: '',
  protocol41: true,
  changedRows: 0 }
```

## Others

Setup as sequence read from pool or random select.

```
cluster.setDbSelectStrategy(1);
```

Result:

```
[2015-04-06 09:37:23.767] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.778] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.779] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.779] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.780] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.781] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.782] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.782] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.784] [DEBUG] [default] - [index.js - query] using master pool...
[2015-04-06 09:37:23.785] [DEBUG] [default] - [index.js - query] using master pool...
Result: { fieldCount: 0,
  affectedRows: 1,
  insertId: 50,
  serverStatus: 2,
  warningCount: 0,
  message: '',
  protocol41: true,
  changedRows: 0 }
``` 
