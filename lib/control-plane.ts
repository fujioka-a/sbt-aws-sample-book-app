import * as sbt from '@cdklabs/sbt-aws';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';

dotenv.config();

export class ControlPlaneStack extends Stack {
  public readonly regApiGatewayUrl: string;
  public readonly eventManager: sbt.IEventManager;

  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id, props);

    const cognitoAuth = new sbt.CognitoAuth(this, 'CognitoAuth', {
      // Avoid checking scopes for API endpoints. for testing purposes.
      setAPIGWScopes: false,
    });

    const controlPlane = new sbt.ControlPlane(this, 'ControlPlane', {
      auth: cognitoAuth,
      systemAdminEmail: process.env.SYSTEM_ADMIN_EMAIL || 'default@example.com',
    });

    // ここで公開プロパティを設定
    this.eventManager = controlPlane.eventManager;
    this.regApiGatewayUrl = controlPlane.controlPlaneAPIGatewayUrl;
  }
}
