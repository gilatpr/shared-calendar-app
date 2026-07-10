const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Get all events for user
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.userId })
      .populate('owner', 'username')
      .sort({ startDateTime: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startDateTime, endDateTime, category, isRecurring } = req.body;

    const event = new Event({
      title,
      description,
      startDateTime,
      endDateTime,
      owner: req.user.userId,
      category,
      isRecurring
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, startDateTime, endDateTime, category, isRecurring } = req.body;

    // Check if user is owner or admin
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.owner.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, startDateTime, endDateTime, category, isRecurring },
      { new: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user is owner or admin
    if (event.owner.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;