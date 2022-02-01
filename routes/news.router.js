const {Router} = require("express");
const db = require("../models");

const NewsApiRouter = Router();

NewsApiRouter.get('/get', async function (req, res) {
    try {
        const {start, count} = req.query;

        let posts = await db.Post.findAll({
            offset: +start,
            limit: +count
        });

        if (posts.length) {
            res.json({
                success: 'Отправлено ' + posts.length + ' постов!',
                posts
            });
            return;
        }

        res.json({
            error: 'Больше постов нету!'
        });
    } catch (e) {
        console.log(e)
    }
});

module.exports = NewsApiRouter;