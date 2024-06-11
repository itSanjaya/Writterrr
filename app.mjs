import express from 'express';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

import './db.mjs';
import postRouter from './routes/post.mjs';

const Post = mongoose.model('Post');
const User = mongoose.model('User');

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}))
app.use(methodOverride('_method'))

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check json web token exists and is verified
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');
            } else {
                console.log(decodedToken);
                next();
            }
        })
    } else {
        res.redirect('/login');
    }
}

// check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null;
                next();
            } else {
                console.log(decodedToken);
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        })
    } else {
        res.locals.user = null;
        next();
    }
}

app.get('*', checkUser);
  
app.get('/', requireAuth, async (req, res) => {
    const posts = await Post.find().sort({
        createdAt: 'desc'})
    res.render("posts/index", {posts : posts})
})

const maxAge= 3 * 24 * 60 * 60;
const createToken = id => {
    return jwt.sign({id}, process.env.SECRET_KEY, {
        expiresIn: maxAge
    });
};

const handleErrors = (err) => {
    console.log(err.message, err.code)
    let errors = { email: '', password: '' }

    // incorrect email
    if (err.message === 'Incorrect email') {
        errors.email = 'That email is not registered';
    }
    // incorrect password
    if (err.message === 'Incorrect password') {
        errors.password = 'That password is incorrect';
    }

    // duplicate error code
    if (err.code === 11000) {
        errors.email = 'That email is already registered'
        return  errors
    }

    // validation errors
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message
        })
    }
    return errors
}

app.get("/login", (req, res) => {
    res.render(__dirname + "/views/posts/login");
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id })
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
})

app.get('/signup', (req, res) => {
    res.render(__dirname + "/views/posts/signup");
})

app.post('/signup', async(req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.create({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (err) {
        const errors = handleErrors(err)
        res.status(400).json({ errors })
    }
})

app.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/login');
})


app.use("/posts", postRouter)

app.listen(process.env.PORT || 3000);
