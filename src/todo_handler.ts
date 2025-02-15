// lambda/todo-handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// v3のDynamoDBClientと、DocumentClientユーティリティをインポート
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME!;

// ベースのクライアント
const dynamoClient = new DynamoDBClient({});

// DocumentClient相当のラッパ
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

export const getTodosHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  try {
    // ScanCommand で全件取得
    const data = await dynamo.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

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
    // GetCommand
    const data = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

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

    // PutCommand
    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newTodo,
      })
    );

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

    // UpdateCommand
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set title = :title, completed = :completed',
        ExpressionAttributeValues: {
          ':title': body.title,
          ':completed': body.completed,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

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

    // DeleteCommand
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    return { statusCode: 204, body: '' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
