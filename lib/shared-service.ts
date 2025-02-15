// lib/todo-stack.ts
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

    const todoFunction = new lambda.Function(this, 'TodoFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'app.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
        COGNITO_USER_POOL_ID: props.CognitoUserPool.userPoolId,
      },
    });
    table.grantReadWriteData(todoFunction);

    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo Service',
      description: 'CRUD operations for Todo tasks using Express routing.',
    });

    // プロキシ統合でExpressルーティングを全て委譲
    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(todoFunction),
    });
  }
}
