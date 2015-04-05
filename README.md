MySQL Master Slave
====

This module is depend on mysql module for build the master, slave database environment. 

# Installation

```
npm install mysql-master-slave
```

# Usage Sampple:

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
