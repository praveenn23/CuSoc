const { google } = require('googleapis');
const { Readable } = require('stream');

/**
 * Returns an authenticated Google Drive client using the Service Account credentials
 * from environment variables.
 */
function getDriveClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file buffer to Google Drive and return its public URL.
 * @param {Buffer} buffer - File content
 * @param {string} filename - Target filename
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
async function uploadToDrive(buffer, filename, mimeType) {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata = {
    name: filename,
    parents: folderId ? [folderId] : [],
  };

  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink, webContentLink',
  });

  const fileId = response.data.id;

  // Make file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  // Return a direct view link
  return `https://drive.google.com/file/d/${fileId}/view`;
}

module.exports = { uploadToDrive };
