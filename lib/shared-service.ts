import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ToDoProps extends cdk.StackProps {
  CognitoUserPool: cognito.UserPool;
  CognitoUserClientId: string;
}

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ToDoProps) {
    super(scope, id, props);

    // DynamoDBテーブル作成
    const table = new dynamodb.Table(this, 'TodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // NodejsFunctionで共通化するプロパティ
    const commonNodejsFunctionProps: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName,
        COGNITO_USER_POOL_ID: props.CognitoUserPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      // 必要に応じて bundling オプションなどを指定できます
      // bundling: {
      //   externalModules: ['aws-sdk'], // など
      // },
    };

    // getTodos用Lambda
    const getTodosFunction = new NodejsFunction(this, 'GetTodosFunction', {
      ...commonNodejsFunctionProps,
      entry: 'src/todo_handler.ts',      // ビルド対象のTSファイルを指定
      handler: 'getTodosHandler',        // todo_handler.ts内のexport関数名
    });
    table.grantReadWriteData(getTodosFunction);

    // getTodo用Lambda
    const getTodoFunction = new NodejsFunction(this, 'GetTodoFunction', {
      ...commonNodejsFunctionProps,
      entry: 'src/todo_handler.ts',
      handler: 'getTodoHandler',
    });
    table.grantReadWriteData(getTodoFunction);

    // createTodo用Lambda
    const createTodoFunction = new NodejsFunction(this, 'CreateTodoFunction', {
      ...commonNodejsFunctionProps,
      entry: 'src/todo_handler.ts',
      handler: 'createTodoHandler',
    });
    table.grantReadWriteData(createTodoFunction);

    // updateTodo用Lambda
    const updateTodoFunction = new NodejsFunction(this, 'UpdateTodoFunction', {
      ...commonNodejsFunctionProps,
      entry: 'src/todo_handler.ts',
      handler: 'updateTodoHandler',
    });
    table.grantReadWriteData(updateTodoFunction);

    // deleteTodo用Lambda
    const deleteTodoFunction = new NodejsFunction(this, 'DeleteTodoFunction', {
      ...commonNodejsFunctionProps,
      entry: 'src/todo_handler.ts',
      handler: 'deleteTodoHandler',
    });
    table.grantReadWriteData(deleteTodoFunction);

    // API Gatewayの作成
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo Service',
      description: 'CRUD operations for Todo tasks.',
    });

    // /todos リソース
    const todos = api.root.addResource('todos');
    todos.addMethod('GET', new apigateway.LambdaIntegration(getTodosFunction));
    todos.addMethod('POST', new apigateway.LambdaIntegration(createTodoFunction));

    // /todos/{id} リソース
    const todo = todos.addResource('{id}');
    todo.addMethod('GET', new apigateway.LambdaIntegration(getTodoFunction));
    todo.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoFunction));
    todo.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoFunction));
  }
}
