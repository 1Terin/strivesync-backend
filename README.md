# StriveSync Backend API

This project contains the AWS Serverless backend for the StriveSync application. It is built using AWS SAM (Serverless Application Model) and TypeScript.

## Project Structure

- `functions/`: Contains the source code for individual AWS Lambda functions.
- `common/`: Houses shared utilities, helper functions, and common logic used across multiple Lambda functions.
- `sam-templates/`: Defines the AWS CloudFormation/SAM templates for deploying the serverless infrastructure (Lambdas, API Gateway, DynamoDB, Cognito, etc.).
- `tests/`: Contains unit and integration tests for the backend.
- `src/api-types/`: (Copied) Shared TypeScript interfaces for API contracts.
- `src/shared-utils/`: (Copied) Shared utility functions used by both frontend and backend.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (or Yarn/pnpm)
- AWS CLI configured with credentials
- AWS SAM CLI

### Installation

1.  Navigate into this directory:
    ```bash
    cd strivesync-backend-api
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` and fill in your environment variables.

### Local Development

To run the backend API locally using SAM CLI:

```bash
sam local start-api -p 3000 --container-host 0.0.0.0