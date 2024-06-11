import express from 'express'

import mongoose from 'mongoose';
import '../db.mjs';
import path from "path";
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const Post = mongoose.model('Post');
const User = mongoose.model('User');

const router = express.Router()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


router.get("/create", (req, res) => {
    res.render(__dirname + "/../views/posts/create", { post: new Post() });
})

router.get("/edit/:id", async (req, res) => {
    const post = await Post.findById(req.params.id)
    res.render(__dirname + "/../views/posts/edit", { post: post });
})

router.get("/:slug", async (req, res) => {
    const post = await Post.findOne({ slug: req.params.slug })
    if (post == null) {
        res.redirect("/")
    };

    res.render(__dirname + "/../views/posts/view", { post: post });
})

router.post("/", async (req, res, next) => {
    req.post = new Post()
    next()
},
    saveandredirect(__dirname + "/../views/posts/create"))

router.put("/:id", async (req, res, next) => {
    req.post = await Post.findById(req.params.id)
    next()
},
    saveandredirect(__dirname + "/../views/posts/edit"))

router.delete("/:id", async (req, res) => {
    console.log("delete called")
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/");
})

function saveandredirect(path) {
    return async (req, res) => {
        let post = req.post
        post.title = req.body.title
        post.description = req.body.description
        post.content = req.body.content
        try {
            post = await post.save()
            res.redirect(`/posts/${post.slug}`)
        } catch (e) {
            res.render(__dirname + `/../views/posts/${path}`, { post: post })
        }
    }
}

export default router;