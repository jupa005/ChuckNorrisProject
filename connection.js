const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "profico",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
  } else {
    console.log("Connected to database");
  }
});

module.exports = connection;
