import * as sbt from '@cdklabs/sbt-aws';
import { Stack, aws_apigateway } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

import * as cognito from 'aws-cdk-lib/aws-cognito';


dotenv.config();

export class ControlPlaneStack extends Stack {
  public readonly regApiGatewayUrl: string;
  public readonly eventManager: sbt.IEventManager;
  // ↓ MockBillingProviderそのものを保持したい場合
  public readonly billingProvider: sbt.MockBillingProvider;

  public readonly userPool: cognito.UserPool;
  public readonly userClientId: string;

  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id, props);

    const cognitoAuth = new sbt.CognitoAuth(this, 'CognitoAuth', {
      setAPIGWScopes: false,
    });

    // billingProvider プロパティはクラスインスタンス
    this.billingProvider = new sbt.MockBillingProvider(this, 'MockBillingProvider');

    const controlPlane = new sbt.ControlPlane(this, 'ControlPlane', {
      auth: cognitoAuth,
      systemAdminEmail: process.env.SYSTEM_ADMIN_EMAIL || 'default@example.com',
    });

    this.eventManager = controlPlane.eventManager;
    this.regApiGatewayUrl = controlPlane.controlPlaneAPIGatewayUrl;

    this.userPool = cognitoAuth.userPool;
    this.userClientId = cognitoAuth.userClientId
  }
}
