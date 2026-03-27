require('dotenv').config();
const { google } = require('googleapis');

const getDriveClient = () => {
    const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: email, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
};

async function simulate() {
    const drive = getDriveClient();
    const configuredId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log('Configured ID:', configuredId);

    try {
        const res = await drive.files.get({
            fileId: configuredId,
            fields: 'id',
            supportsAllDrives: true,
        });
        console.log('Get successful!');
    } catch (err) {
        console.log('Catch block hit for drive.files.get:', err.message);
    }

    console.log('Proceeding to fallback search...');
    const FOLDER_NAME = 'ABHYUTTHANAM_Proofs';
    const searchRes = await drive.files.list({
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });
    console.log('Found', searchRes.data.files.length, 'fallback folders.');
    if (searchRes.data.files[0]) {
        console.log('Fallback ID:', searchRes.data.files[0].id);
    }
}

simulate();
