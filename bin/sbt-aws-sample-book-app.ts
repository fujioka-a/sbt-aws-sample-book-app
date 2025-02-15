#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ControlPlaneStack } from '../lib/control-plane';
import { AppPlaneStack } from '../lib/app-plane';
import { TodoStack } from '../lib/shared-service';
import { AuthStack } from '../lib/auth';

import 'source-map-support/register';

const app = new cdk.App();

const controlPlaneStack = new ControlPlaneStack(app, 'ControlPlaneStack', {});

new AppPlaneStack(app, 'AppPlaneStack', {
  eventManager: controlPlaneStack.eventManager,
  billingProvider: controlPlaneStack.billingProvider,
});

new AuthStack(app, 'AuthStack', {
  userPoolId: controlPlaneStack.userPool.userPoolId,
  userPoolClientId: controlPlaneStack.userClientId,
});

new TodoStack(app, 'SharedServiceStack', {
  CognitoUserPool: controlPlaneStack.userPool,
  CognitoUserClientId: controlPlaneStack.userClientId,
});
