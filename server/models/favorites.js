import { DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDocClient } from '../config/ddbClient.js';

const FAVORITES_TABLE = process.env.DDB_FAVORITES_TABLE || 'Favorites';


async function toggleFavorite(userId, exerciseName, isFavorite) {
  const timestamp = new Date().toISOString();

  if (isFavorite) {
    await ddbDocClient.send(
      new PutCommand({
        TableName: FAVORITES_TABLE,
        Item: {
          userId,
          exerciseName,
          isFavorite: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );
  } else {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: FAVORITES_TABLE,
        Key: {
          userId,
          exerciseName,
        },
      })
    );
  }

  return { userId, exerciseName, isFavorite };
}


async function getFavorites(userId) {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: FAVORITES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
  );

  return result.Items || [];
}

/**
 * Check if an exercise is favorited
 */
async function isFavorite(userId, exerciseName) {
  try {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: FAVORITES_TABLE,
        KeyConditionExpression: 'userId = :userId AND exerciseName = :exerciseName',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':exerciseName': exerciseName,
        },
        Limit: 1,
      })
    );

    return result.Items && result.Items.length > 0;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

export { getFavorites, isFavorite, toggleFavorite };

