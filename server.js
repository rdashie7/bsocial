const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const errorMiddleware = require('./middlewares/error-middleware');
const path = require("path");
const useragent = require("express-useragent");
require('dotenv').config();

const
    PORT = process.env.PORT || 5000,
    CORS_ORIGIN = process.env.CLIENT_URL;

const app = express();

app.use(express.static(path.resolve(__dirname, 'client/build')));
app.use(fileUpload({}));
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: CORS_ORIGIN,
}));
app.use(useragent.express());
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(express.json({limit: '50mb'}));

app.use('/api/auth', require('./routes/auth.router'));
app.use('/api/news', require('./routes/news.router'));
app.use('/api/user', require('./routes/user.router'));

app.use(errorMiddleware);

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => console.log('App listening on port ' + PORT));