require('dotenv').config()

// const SECRET_KEY = process.env.EMAIL_API_KEY;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGO_PASSWORD;


const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const cors = require('cors');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');


const errorController = require('./controllers/error');
const User = require('./models/user');
const {
  MongoClient,
  ServerApiVersion
} = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URL || `
mongodb + srv: //azufelt:${password}@redwood-design-shop.2u2we.mongodb.net/redwood-design-shop?retryWrites=true&w=majority
`;




// `mongodb+srv://azufelt:${password}@redwood-design-shop.2u2we.mongodb.net/redwood-design-shop?retryWrites=true&w=majority`;
// const client = new MongoClient(MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1
// });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });




const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');


const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const corsOptions = {
  origin: "https://redwood-design-shop.herokuapp.com/",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const options = {
  family: 4
};

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

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
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

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '../500',
    isAuthenticated: req.session.isLoggedIn
  });
});




mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(PORT);
  })
  .catch(err => {
    console.log(err);
  });