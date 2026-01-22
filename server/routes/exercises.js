import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getAllExercises,
    getExerciseById,
    getExerciseHistory,
    getTotalCaloriesBurned,
    getTotalExerciseDuration,
    recordExercise,
} from '../models/exerciseHistory.js';

const router = express.Router();


router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const exerciseData = req.body;

    if (!exerciseData.exerciseName) {
      return res.status(400).json({
        success: false,
        message: 'exerciseName is required',
      });
    }

    const result = await recordExercise(userId, exerciseData);

    res.status(201).json({
      success: true,
      message: 'Exercise recorded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Record exercise error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record exercise',
      error: error.message,
    });
  }
});

/**
 * Get exercise history within a date range
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const history = await getExerciseHistory(userId, startDate, endDate);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get exercise history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exercise history',
      error: error.message,
    });
  }
});

/**
 * Get all exercises (paginated)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, lastKey } = req.query;
    const userId = req.userId;

    const result = await getAllExercises(
      userId,
      parseInt(limit),
      lastKey ? JSON.parse(lastKey) : null
    );

    res.json({
      success: true,
      data: result.items,
      pagination: {
        lastEvaluatedKey: result.lastEvaluatedKey,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
  } catch (error) {
    console.error('Get all exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exercises',
      error: error.message,
    });
  }
});

/**
 * Get exercise by ID
 */
router.get('/:exerciseId', authenticate, async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.userId;

    const exercise = await getExerciseById(userId, exerciseId);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error('Get exercise by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exercise',
      error: error.message,
    });
  }
});

/**
 * Get total exercise duration
 */
router.get('/stats/duration', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    const totalDuration = await getTotalExerciseDuration(
      userId,
      startDate || null,
      endDate || null
    );

    res.json({
      success: true,
      data: { totalDuration },
    });
  } catch (error) {
    console.error('Get total duration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get total duration',
      error: error.message,
    });
  }
});

/**
 * Get total calories burned
 */
router.get('/stats/calories', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    const totalCalories = await getTotalCaloriesBurned(
      userId,
      startDate || null,
      endDate || null
    );

    res.json({
      success: true,
      data: { totalCalories },
    });
  } catch (error) {
    console.error('Get total calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get total calories',
      error: error.message,
    });
  }
});

export default router;

