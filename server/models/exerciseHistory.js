import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ddbDocClient } from '../config/ddbClient.js';

const EXERCISE_HISTORY_TABLE = process.env.DDB_EXERCISE_HISTORY_TABLE || 'ExerciseHistory';


async function recordExercise(userId, exerciseData) {
  const exerciseId = uuidv4();
  const timestamp = new Date().toISOString();

  const item = {
    userId,
    timestamp,
    exerciseId,
    exerciseName: exerciseData.exerciseName,
    duration: Number(exerciseData.duration || 0), 
    calories: Number(exerciseData.calories || 0),
    sets: exerciseData.sets || [],
    reps: exerciseData.reps || [],
    weight: exerciseData.weight || null,
    notes: exerciseData.notes || '',
    createdAt: timestamp,
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: EXERCISE_HISTORY_TABLE,
      Item: item,
    })
  );

  return item;
}

/**
 * Get exercise history for a user within a date range
 */
async function getExerciseHistory(userId, startDate, endDate) {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: EXERCISE_HISTORY_TABLE,
      KeyConditionExpression: 'userId = :userId AND #timestamp BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate,
        ':endDate': endDate,
      },
      ScanIndexForward: false, // Sort descending by timestamp
    })
  );

  return result.Items || [];
}

/**
 * Get all exercises for a user (paginated)
 */
async function getAllExercises(userId, limit = 50, lastEvaluatedKey = null) {
  const params = {
    TableName: EXERCISE_HISTORY_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false,
    Limit: limit,
  };

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  const result = await ddbDocClient.send(new QueryCommand(params));

  return {
    items: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
}

/**
 * Get exercise by ID
 */
async function getExerciseById(userId, exerciseId) {
  // Since exerciseId is not part of the key, we need to query and filter
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: EXERCISE_HISTORY_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'exerciseId = :exerciseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':exerciseId': exerciseId,
      },
    })
  );

  return result.Items?.[0] || null;
}

/**
 * Get total exercise duration for a user (all time or within date range)
 */
async function getTotalExerciseDuration(userId, startDate = null, endDate = null) {
  let items;

  if (startDate && endDate) {
    items = await getExerciseHistory(userId, startDate, endDate);
  } else {
    const result = await getAllExercises(userId, 1000); // Get large batch
    items = result.items;
  }

  return items.reduce((total, item) => total + (item.duration || 0), 0);
}

/**
 * Get total calories burned from exercises
 */
async function getTotalCaloriesBurned(userId, startDate = null, endDate = null) {
  let items;

  if (startDate && endDate) {
    items = await getExerciseHistory(userId, startDate, endDate);
  } else {
    const result = await getAllExercises(userId, 1000);
    items = result.items;
  }

  return items.reduce((total, item) => total + (item.calories || 0), 0);
}

export {
    getAllExercises,
    getExerciseById, getExerciseHistory, getTotalCaloriesBurned, getTotalExerciseDuration, recordExercise
};

