// lambda/todo-handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamo = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME!;

export const getTodosHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    const data = await dynamo.scan({ TableName: TABLE_NAME }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};

export const getTodoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    const id = event.pathParameters?.id;
    const data = await dynamo.get({ TableName: TABLE_NAME, Key: { id } }).promise();
    if (!data.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Todo not found' }) };
    }
    return { statusCode: 200, body: JSON.stringify(data.Item) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};

export const createTodoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const newTodo = {
      id: uuidv4(),
      title: body.title,
      completed: false,
    };
    await dynamo.put({ TableName: TABLE_NAME, Item: newTodo }).promise();
    return { statusCode: 201, body: JSON.stringify(newTodo) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};

export const updateTodoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    const id = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : {};
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set title = :title, completed = :completed',
      ExpressionAttributeValues: {
        ':title': body.title,
        ':completed': body.completed,
      },
      ReturnValues: 'ALL_NEW',
    };
    const result = await dynamo.update(params).promise();
    return { statusCode: 200, body: JSON.stringify(result.Attributes) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};

export const deleteTodoHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    const id = event.pathParameters?.id;
    await dynamo.delete({ TableName: TABLE_NAME, Key: { id } }).promise();
    return { statusCode: 204, body: '' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
