const express = require("express");
const axios = require("axios");
// const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

app.use(express.json());

const connection = require("./connection");
const { cookieJwtAuth } = require("./middleware/cookieJwtAuth");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "antetest@gmail.com",
    pass: "password",
  },
});

async function getChuckNorrisJoke() {
  try {
    const response = await axios.get("https://api.chucknorris.io/jokes/random");
    const data = response.data;
    return data.value;
  } catch (error) {
    console.error(error);
    throw new Error("Server error");
  }
}

app.get("/getJoke", cookieJwtAuth, async (req, res) => {
  res.send("Autorizacija uspješna");
  const joke = await getChuckNorrisJoke();

  let message = {
    from: "antetest@gmail.com",
    to: req.email,
    subject: "Chuck Norris Joke",
    text: joke,
  };

  console.log(message);

  // transporter.sendMail(message, (err, info) => {
  //   if (err) {
  //     console.log("Error occurred: ", err);
  //   } else {
  //     console.log("Message sent: ", info.messageId);
  //   }
  // });
});

app.post("/signup", (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  bcrypt.hash(password, 10, function (err, hash) {
    if (err) {
      console.log(err);
      res.status(500).send("Error occurred while hashing password");
    } else {
      const sql =
        "INSERT INTO users (email, password, firstName, lastName) VALUES (?,?, ?, ?)";
      const values = [email, hash, firstName, lastName];

      connection.query(sql, values, (err, result) => {
        if (err) {
          console.log(err);
          res
            .status(500)
            .send("Error occurred while inserting data into the database");
        } else {
          // console.log(result);
          res.send("Data inserted successfully!");
        }
      });
    }
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT email, password FROM users WHERE email = ?";
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error retrieving data from database");
    } else {
      if (results.length > 0) {
        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send("Error comparing passwords");
          } else if (result) {
            //kreiranje tokena
            const token = jwt.sign({ email }, "secretKeyProfico");
            res.cookie("token", token);

            return res.redirect("/getJoke");
          } else {
            res.status(401).send("Incorrect password");
          }
        });
      } else {
        res.status(404).send("User not found");
      }
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
