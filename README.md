# Docker Backup and CSV Export

This project is a learning project that demonstrates how to perform backups and export tables as CSV files within a Docker container. It provides a script written in TypeScript that automates the process of creating a database dump and exporting tables as CSV files, and then uploading them to Amazon S3 using the AWS SDK. The script is designed to be run inside a Docker container.

## Pre-requisites

Before getting started, ensure that you have the following prerequisites installed on your machine:

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Node.js: [Install Node.js](https://nodejs.org)

## Getting Started

To use this project, follow the steps below:

1. Clone the repository:

   ```bash
   git clone https://github.com/jaovito/pg-docker-backup-s3.git
   ```

2. Change into the project directory:

   ```bash
   cd pg-docker-backup-s3
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Configure AWS credentials:

   Copy the `.env.example` to some `.env` file replace the AWS variables with credentials.

5. About the params

   The code uses params inserted on the command to know and create the files, we have the following params:
   - `--name` - it's the name of the folder, the script will insert the files inside this folder;
   - `--database` - it's the name of the database that you want to export your CSV;
   - `--container` - its the name of the docker container (or ID), the default of this variable is `postgres`;
   When the code ends, it's upload the file with `dump_` + `name`, so if you run this command:
    <br />
  
   ```bash
   npm start -- --name test --database some_database --container postgres
   ```
   It will create a folder called `test`, a file `dump_test-{atual_iso_date}` and other folder inside with the CSV

7. Run the code:

   ```bash
   npm start -- --name some_name --database some_database_name --container docker_postgres_container_name
   ```

   Replace `some_name` with the name of the folder where you want to store the backup and CSV files.
   Replace `some_database_name` with the name of the database that you want to export the CSV.
   Replace `docker_postgres_container_name` with the name of the database that you want to export the CSV.

8. The script will generate a database dump file (SQL) and a CSV file for the specified table. It will upload these files to the specified S3 bucket under the specified folder. The script will also remove the local dump and CSV files after uploading them.

## Additional Information

- The `shellCommand` variable in `index.ts` defines the shell command to generate the database dump file. You can modify it according to your specific requirements.
- The `exportCsvCommand` variable in `index.ts` defines the shell command to export a table as a CSV file. Adjust it based on your table name and database configuration.
- The AWS SDK is used to upload files to Amazon S3. Make sure to configure your AWS credentials correctly in order to access your S3 bucket.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to modify and customize this README to fit your project's specific requirements.
