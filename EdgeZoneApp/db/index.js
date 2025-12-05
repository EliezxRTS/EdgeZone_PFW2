const mysql = require("mysql2/promise");
require('dotenv').config();

const pool = mysql.createPool({
        host : '162.241.60.213',
        user : 'jesushe2_eliezer',
        password : 'cr6+op_&swAq',
        database : 'jesushe2_eliezer',
	waitForConnections:true,
	connectionLimit:10,
});

module.exports = pool;