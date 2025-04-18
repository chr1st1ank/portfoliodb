# Some hints for developers

Adding dependencies for the Python backend:

```shell
cd backend && uv add <package> 
```

The project uses taskfile.dev for tasks:

```shell
❯ task
task: Available tasks for this project:
* makemigrations:       Make Django DB migrations
* real-data:            Load real data into DB
* sample-data:          Load sample data into DB
* start-backend:        Start Django backend server
* start-frontend:       Start Vite frontend development server
* test:                 Run frontend tests with Vitest
```
