const express = require('express');
const { ensureAuthenticated, ensureAdmin } = require('./roleauth');
const { Sport, Session, User } = require('./models');
const router = express.Router();
const asyncHandler = require("express-async-handler");

// Admin Dashboard
router.get('/dashboard', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const sports = await Sport.findAll();
    const sessions = await Session.findAll();
    res.render('admindashboard', { sports, sessions, csrfToken: req.csrfToken() });
});

// Manage Sports Page
router.get('/manage-sports', ensureAuthenticated, ensureAdmin, (req, res) => {
    res.render('adminmanagesport', { csrfToken: req.csrfToken() });
});

// Add Sport
router.post('/manage-sports', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const { name } = req.body;
    await Sport.create({ name });
    res.redirect('/admin/dashboard');
});

// Edit Sport Page
router.get('/edit-sport/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const sport = await Sport.findByPk(req.params.id);
    if (!sport) {
        return res.status(404).send("Sport not found");
    }
    res.render('admineditsport', { sport, csrfToken: req.csrfToken() });
});

// Edit Sport - POST request to update the sport
router.post('/edit-sport/:id', ensureAdmin, async (req, res) => {
    try {
        const { name, category } = req.body;
        const sport = await Sport.findByPk(req.params.id);

        if (!sport) {
            req.flash('error', 'Sport not found.');
            return res.redirect('/admin/dashboard');
        }

        await sport.update({ name, category });
        req.flash('success_msg', 'Sport updated successfully.');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/dashboard');
    }
});

// Admin Reports Page
router.get("/reports", ensureAuthenticated, ensureAdmin, asyncHandler(async (req, res) => {
    const report = await Session.findAll({
        include: [{ model: Sport, as: "sport" }],
    });
    res.render("adminreport", { report, csrfToken: req.csrfToken() });
}));

// Manage Sessions Page
router.get("/manage-sessions", ensureAuthenticated, ensureAdmin, asyncHandler(async (req, res) => {
    const sessions = await Session.findAll({
        include: [{ model: Sport, as: "sport" }],
    });
    res.render("adminmanagesession", { sessions, csrfToken: req.csrfToken() });
}));

// Delete Sport (using DELETE)
router.delete("/delete-sport/:id", ensureAuthenticated, ensureAdmin, asyncHandler(async (req, res) => {
    const sport = await Sport.findByPk(req.params.id);

    if (!sport) {
        return res.status(404).json({ success: false, message: "Sport not found." });
    }

    await sport.destroy();
    res.json({ success: true });
}));

// Delete Session (using DELETE)
router.delete("/delete-session/:id", ensureAuthenticated, ensureAdmin, asyncHandler(async (req, res) => {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
        return res.status(404).json({ success: false, message: "Session not found." });
    }

    await session.destroy();
    res.json({ success: true });
}));

module.exports = router;
