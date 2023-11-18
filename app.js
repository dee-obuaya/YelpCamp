// if not in production environment
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ExpressError = require('./utils/ExpressError');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const MongoStore = require('connect-mongo');

const dbUrl = process.env.MONGO_URL;


main()
    .then(() => console.log('Database connected'))
    .catch((err) => console.error.bind(console, 'connection error:'));

async function main() {
  await mongoose.connect(dbUrl);
}

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize()); // to help mongo injection

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: `${process.env.SESSION_SECRET}`
    }
});
store.on("error", function (e) {
    console.log('SESSION STORE ERROR', e)
});

const sessionConfig = {
    store,
    name: 'session',
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true, // cookies only accessible/configurable over https not http
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1000 milliseconds in a second, 60 seconds in a min... 7 days in a week
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudfare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://cdn.jsdelivr.net",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dfemybqoz/",
                "https://images.unsplash.com/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        }
    })
)

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// sets properties that can be found on every (req,res) and accessed by all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, SomethingWent Wrong...'
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});
