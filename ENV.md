# Environment Variables Documentation

This document describes the environment variables used in the Coin Tracker application.

## Core Variables

### `DATABASE_URL`
- **Description**: The connection string for the MySQL database.
- **Format**: `mysql://<user>:<password>@<host>:<port>/<database>`
- **Default for Local Dev**: `mysql://coin_user:coin_password@localhost:3306/coin_db`
- **Source**: Used by Prisma for database operations.

### `AUTH_SECRET`
- **Description**: A secret key used to encrypt Auth.js session tokens and cookies.
- **How to Generate**: You can generate a fresh secret using `npx auth secret`.
- **Note**: This must be kept highly secure and unique for production environments.

### `AUTH_URL`
- **Description**: The base URL of the application.
- **Example**: `http://localhost:3000`
- **Note**: Critical for Auth.js to handle redirects and callbacks correctly.

---

## Service Providers (Optional)

### Google OAuth
To enable Google Login, you need to provide these credentials from the [Google Cloud Console](https://console.cloud.google.com/).

#### `GOOGLE_CLIENT_ID`
- **Description**: The Client ID for your Google OAuth application.

#### `GOOGLE_CLIENT_SECRET`
- **Description**: The Client Secret for your Google OAuth application.

---

## Local Development (Docker)

If you are using the provided `docker-compose.yml`, the following values are used for the database container. While they are defined in `docker-compose.yml`, they must match what you put in your `DATABASE_URL`.

- **`MYSQL_ROOT_PASSWORD`**: `rootpassword`
- **`MYSQL_DATABASE`**: `coin_db`
- **`MYSQL_USER`**: `coin_user`
- **`MYSQL_PASSWORD`**: `coin_password`
