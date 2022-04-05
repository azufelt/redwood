require('dotenv').config();
const path = require('path');

// const SECRET_KEY = process.env.EMAIL_API_KEY;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

//required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//listen PORT
const PORT = process.env.PORT || 5000;

//Session and DB 
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const cors = require('cors');
const csrf = require('csurf');
const flash = require('connect-flash');
const app = express();

const MONGODB_URI = `mongodb+srv://redwood:${password}@redwood-design-shop.hmyjy.mongodb.net/redwood-design?retryWrites=true&w=majority`;


const errorController = require('./controllers/error');
const User = require('./models/user');
const {
  MongoClient,
  ServerApiVersion
} = require('mongodb');


//routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();


// Make requests
app.set('view engine', 'ejs');
app.set('views', 'views');

const corsOptions = {
  origin: "https://redwood-design.herokuapp.com/",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const options = {
  family: 4
};

//parse json body of the request
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

//authenticate user
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});


// Using our routes as defined.
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '../500',
    // isAuthenticated: req.session.isLoggedIn
  });
});




mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 5000);
  })
  .catch(err => {
    console.log(err);
  });