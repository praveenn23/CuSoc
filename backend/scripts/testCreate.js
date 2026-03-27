require('dotenv').config();
const { google } = require('googleapis');
const { Readable } = require('stream');

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

async function testCreate() {
    const drive = getDriveClient();
    const folderId = "1RYwoBrXx9AFf9RTDm1mz88EkAmtIYauM";
    console.log('Testing create in folder:', folderId);

    try {
        const res = await drive.files.create({
            requestBody: {
                name: "test_file.txt",
                parents: [folderId]
            },
            media: {
                mimeType: "text/plain",
                body: Readable.from("Hello world")
            },
            fields: 'id',
            supportsAllDrives: true
        });
        console.log('✅ Create successful! ID:', res.data.id);
    } catch (err) {
        console.error('❌ Create failed:', err.message);
        if (err.errors) console.log('Details:', JSON.stringify(err.errors, null, 2));
    }
}

testCreate();
