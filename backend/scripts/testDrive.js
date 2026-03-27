require('dotenv').config();
const { google } = require('googleapis');

async function testDrive() {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log('Testing access for email:', email);
    console.log('Testing access for folder:', folderId);

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        const res = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType' });
        console.log('✅ Folder found!');
        console.log('Name:', res.data.name);
        console.log('MimeType:', res.data.mimeType);
    } catch (e) {
        console.error('❌ Folder access failed:', e.message);
        if (e.errors) console.log('Details:', JSON.stringify(e.errors, null, 2));
    }

    try {
        console.log('Attempting to list files in drive to see what I CAN see...');
        const res2 = await drive.files.list({ pageSize: 5, fields: 'files(id, name)' });
        console.log('Found', res2.data.files.length, 'total files accessible by me:');
        res2.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
    } catch (e) {
        console.error('❌ List failed:', e.message);
    }

  } catch (err) {
    console.error('Script error:', err.message);
  }
}

testDrive();
