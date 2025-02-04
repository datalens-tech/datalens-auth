import {execFileSync, execSync} from 'node:child_process';
import path from 'node:path';

console.log('Checking migration timestamp consistency...');

try {
    execSync('git fetch origin main');
} catch (error) {
    const err = error as Error;
    console.error('Failed to fetch main:', err.message);
    process.exit(1);
}
const appPath = path.join(__dirname, '../../');

const migrationsFolder = path.join(appPath, 'src/db/migrations');

const getNewMigrationFiles = (folder: string) => {
    try {
        const addedFiles = execFileSync(
            'git',
            ['diff', '--name-only', '--diff-filter=A', 'origin/main..HEAD', folder],
            {encoding: 'utf8'},
        )
            .trim()
            .split('\n')
            .filter(Boolean);
        return addedFiles;
    } catch (error) {
        const err = error as Error;
        console.error('Error while getting added migrations:', err.message);
        process.exit(1);
    }
};

const extractTimestamp = (file: string) => {
    const baseName = path.basename(file);
    const timestamp = parseInt(baseName.split('_').at(0) as string, 10);
    return timestamp;
};

const getMaxTimestampInMain = (folder: string) => {
    try {
        const mainFiles = execFileSync(
            'git',
            ['ls-tree', '-r', '--name-only', 'origin/main', folder],
            {encoding: 'utf8'},
        )
            .trim()
            .split('\n')
            .filter(Boolean);
        const timestamps = mainFiles.map(extractTimestamp);
        return Math.max(...timestamps);
    } catch (error) {
        const err = error as Error;
        console.error('Error while getting main branch last migration timestamp:', err.message);
        process.exit(1);
    }
};

const newMigrationFiles = getNewMigrationFiles(migrationsFolder);
const latestMainTimestamp = getMaxTimestampInMain(migrationsFolder);
if (newMigrationFiles.length === 0) {
    console.log('OK. No migrations added.');
    process.exit(0);
}
const invalidFiles: string[] = [];
newMigrationFiles.forEach((file) => {
    const timestamp = extractTimestamp(file);
    if (timestamp <= latestMainTimestamp) {
        invalidFiles.push(file);
    }
});

if (invalidFiles.length > 0) {
    console.error(
        'Error! Added migration with outdated timestamp. Please update following migrations:',
    );
    invalidFiles.forEach((file) => console.error(`  ${file}`));
    process.exit(1);
} else {
    console.log('OK. All new migrations have correct timestamps.');
}
