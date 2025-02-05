const express = require('express');
const { ensureAuthenticated } = require('./roleauth');
const { User, Session, Sport, PlayerSession } = require('./models');
const router = express.Router();
const { Op } = require('sequelize');

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const createdSessions = await Session.findAll({
    where: { creatorId: req.user.id },
    include: [
      { model: Sport, as: 'sport' },
      { model: User, as: 'players' },
    ],
  });

  const joinedSessions = await PlayerSession.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Session,
        as: 'session',
        include: [{ model: Sport, as: 'sport' }],
      },
    ],
  });

  const otherSessions = await Session.findAll({
    where: {
      creatorId: { [Op.ne]: req.user.id },
      startTime: { [Op.gt]: new Date() },
    },
    include: { model: Sport, as: 'sport' },
  });

  res.render('playerdashboard', {
    createdSessions,
    joinedSessions,
    otherSessions,
    csrfToken: req.csrfToken(),
  });
});


router.get('/create-session', ensureAuthenticated, async (req, res) => {
  try {
    const sports = await Sport.findAll();
    res.render('playercreatesession', { sports, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/create-session', ensureAuthenticated, async (req, res) => {
  const { sportId, location, startTime, endTime, maxPlayers } = req.body;

  try {
    await Session.create({
      sportId,
      creatorId: req.user.id,
      location,
      startTime,
      endTime,
      maxPlayers,
      availableSpots: maxPlayers,
    });

    res.redirect('/player/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/join-session/:sessionId', ensureAuthenticated, async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    // Fetch the session with the associated players
    const session = await Session.findByPk(sessionId, {
      include: [{ model: User, as: 'players' }],
    });

    // Check if the user is already a player in the session
    if (session.players.some((player) => player.id === req.user.id)) {
      return res.status(400).send('You have already joined this session.');
    }

    // Check if the session has available spots
    if (session.availableSpots <= 0) {
      return res.status(400).send('Session is full');
    }

    // Create the association between the user and the session (PlayerSession table)
    await PlayerSession.create({
      userId: req.user.id,
      sessionId,
    });

    // Decrease the available spots by 1
    session.availableSpots -= 1;

    // Save the session with the updated available spots
    await session.save();

    // Redirect the player to the dashboard after successfully joining
    res.redirect('/player/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/cancel-session/:sessionId', ensureAuthenticated, async (req, res) => {
  const { sessionId } = req.params;
  const { reason } = req.body;

  try {
    const session = await Session.findByPk(sessionId);

    if (!session) {
      return res.status(404).send('Session not found');
    }

    await PlayerSession.destroy({
      where: { userId: req.user.id, sessionId },
    });

    session.availableSpots += 1;
    await session.save();

    res.redirect('/player/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/delete-session/:sessionId', ensureAuthenticated, async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const session = await Session.findOne({
      where: { id: sessionId, creatorId: req.user.id },
    });

    if (!session) {
      return res.status(404).send('Session not found or you are not the creator.');
    }

    await session.destroy();

    res.redirect('/player/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
