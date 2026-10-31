# Server Environment Configuration

Create a `.env` file in the `server` folder and add the following variables:

Then add DB_PASSWORD with your actual PostgreSQL password.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=university_event_management
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password
JWT_SECRET=replace_with_a_long_random_secret
```