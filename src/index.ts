import 'dotenv/config';
import { exec } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));
const folderName = args.name;
const databaseName = args.database;
const containerName = args.container || 'postgres';
const usersTable = args.usersTable || 'users';
const postgresUser = args.dbUser || 'postgres';
const atualDate = new Date().toISOString();

if (!folderName) {
  throw new Error('You need to input the folder name!\nTry to run with the name param, like: --name FOLDER_NAME');
}

if (!databaseName) {
  throw new Error('You need to input the database name!\nTry to run with the database param, like: --database my_database_name');
}

// Shell commant to generate the dump file
const shellCommand = `docker exec -t ${containerName} pg_dumpall -c -U ${postgresUser} > dump_${folderName}.sql`;

// Shell command to export the users table to csv file
const exportCsvCommand = `docker exec ${containerName} psql -U ${postgresUser} -d ${databaseName} -c "COPY (SELECT * FROM ${usersTable}) TO '/tmp/users.csv' WITH (FORMAT CSV, HEADER);" && docker cp ${containerName}:/tmp/users.csv .`;

// Bucket name to storage the file
const bucketName = String(process.env.AWS_S3_BUCKET);

// AWS credentials
const s3Client = new S3Client({
  region: String(process.env.AWS_DEFAULT_REAGION), // Use your region
  credentials: {
    accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
    secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
  },
});

// Function that run the backup command
function runShellCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar comando: ${error.message}`);
        reject(error);
      } else {
        console.log(`Comando executado com sucesso: ${stdout}`);
        resolve();
      }
    });
  });
}

// Function that deploy the file to Amazon S3
async function uploadFileToS3(fileName: string, folderName: string, useLocalTime?: boolean): Promise<void> {
  const fileContent = require('fs').createReadStream(fileName);

  const uploadParams = {
    Bucket: bucketName,
    Key: `${folderName}/${useLocalTime ? '-' + atualDate : ''}${fileName}`,
    Body: fileContent,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    console.log(`Arquivo ${fileName} enviado para o Amazon S3 com sucesso!`);
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo para o Amazon S3:', error);
  }
}

// Function that delete the local file
function deleteLocalFile(fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`rm ${fileName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao excluir arquivo ${fileName}: ${error.message}`);
        reject(error);
      } else {
        console.log(`Arquivo ${fileName} excluído com sucesso`);
        resolve();
      }
    });
  });
}

async function main(): Promise<void> {
  try {
    await runShellCommand(shellCommand);
    await runShellCommand(exportCsvCommand);

    const dumpSqlFileName = `dump_${folderName}.sql`;
    const usersCsvFileName = 'users.csv';

    console.log(dumpSqlFileName);

    await uploadFileToS3(dumpSqlFileName, folderName, true);
    await uploadFileToS3(usersCsvFileName, `${folderName}/tabelas`);

    // Delete the local files after upload
    await deleteLocalFile(dumpSqlFileName);
    await deleteLocalFile(usersCsvFileName);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  }
}

main();
