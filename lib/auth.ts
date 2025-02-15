import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface AuthStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
}

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const authLambdaProps: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'src/auth_handler.ts',
      handler: 'loginHandler',
      environment: {
        USER_POOL_ID: props.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClientId,
      },
    };

    const authLambda = new NodejsFunction(this, 'AuthLambda', authLambdaProps);

    // Lambda から Cognito User Pool API (cognito-idp) を呼べるようにポリシー付与
    // 例: AdminInitiateAuth, AdminRespondToAuthChallenge など
    authLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminRespondToAuthChallenge',
        // 必要に応じてその他のアクション
      ],
      resources: ['*'], // または特定ユーザープールのARNを指定 (要確認)
    }));

    // API Gatewayの作成
    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'Auth Service',
      description: 'Provides user authentication via Cognito.',
    });

    // /login リソース
    const loginResource = api.root.addResource('login');

    // POST /login でauthLambdaを呼び出し
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(authLambda), {});
  }
}
