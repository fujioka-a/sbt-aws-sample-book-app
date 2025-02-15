import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ToDoProps extends cdk.StackProps {
  CognitoUserPool: cognito.UserPool;
}

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ToDoProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'TodoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // ダミーの handler を設定
    const commonLambdaProps: lambda.FunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      // ↓ここで必須のhandlerをダミー値として定義
      handler: 'dummy.handler',
      code: lambda.Code.fromAsset('src'),
      environment: {
        TABLE_NAME: table.tableName,
        COGNITO_USER_POOL_ID: props.CognitoUserPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    };

    // 各Lambdaでhandlerを上書き
    const getTodosFunction = new lambda.Function(this, 'GetTodosFunction', {
      ...commonLambdaProps,
      handler: 'todo_handler.getTodosHandler',
    });

    const getTodoFunction = new lambda.Function(this, 'GetTodoFunction', {
      ...commonLambdaProps,
      handler: 'todo_handler.getTodoHandler',
    });

    const createTodoFunction = new lambda.Function(this, 'CreateTodoFunction', {
      ...commonLambdaProps,
      handler: 'todo_handler.createTodoHandler',
    });

    const updateTodoFunction = new lambda.Function(this, 'UpdateTodoFunction', {
      ...commonLambdaProps,
      handler: 'todo_handler.updateTodoHandler',
    });

    const deleteTodoFunction = new lambda.Function(this, 'DeleteTodoFunction', {
      ...commonLambdaProps,
      handler: 'todo_handler.deleteTodoHandler',
    });

    // テーブルのRead/Write権限を各Lambdaに付与
    table.grantReadWriteData(getTodosFunction);
    table.grantReadWriteData(getTodoFunction);
    table.grantReadWriteData(createTodoFunction);
    table.grantReadWriteData(updateTodoFunction);
    table.grantReadWriteData(deleteTodoFunction);

    // API Gateway作成
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
