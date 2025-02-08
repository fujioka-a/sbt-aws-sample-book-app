#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SbtAwsSampleBookAppStack } from '../lib/sbt-aws-sample-book-app-stack';

const app = new cdk.App();
new SbtAwsSampleBookAppStack(app, 'SbtAwsSampleBookAppStack');
