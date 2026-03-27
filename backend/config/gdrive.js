const { google } = require('googleapis');

let _cachedFolderId = null;

const getDriveClient = () => {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

  if (!email)  throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set in .env');
  if (!rawKey) throw new Error('GOOGLE_PRIVATE_KEY is not set in .env');

  const privateKey = rawKey.includes('\\n')
    ? rawKey.replace(/\\n/g, '\n').trim()
    : rawKey.trim();

  // Redacted log for Vercel debugging
  console.log(`🔑 Using Service Account: ${email.slice(0, 5)}...`);

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
};

const getUploadFolderId = async (drive) => {
  if (_cachedFolderId) return _cachedFolderId;

  const configuredId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (configuredId) {
    try {
      // 1. Basic check if folder is visible
      await drive.files.get({
        fileId: configuredId,
        fields: 'id',
        supportsAllDrives: true,
      });

      // 2. EXTRA check: can we at least list something there to verify "Editor" access?
      // If we only have "Reader" access, drive.files.create will fail later.
      await drive.files.list({
        pageSize: 1,
        q: `'${configuredId}' in parents and trashed=false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      console.log('📁 Using configured Drive folder:', configuredId);
      _cachedFolderId = configuredId;
      return _cachedFolderId;
    } catch (err) {
      console.warn(`⚠️ Configured folder (${configuredId}) not accessible or lacks permissions:`, err.message);
      console.warn('   → Falling back to automatic folder search/creation...');
    }
  }

  // Fallback: search for or create folder in service account's space
  const FOLDER_NAME = 'ABHYUTTHANAM_Proofs';
  const searchRes = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (searchRes.data.files.length > 0) {
    _cachedFolderId = searchRes.data.files[0].id;
    console.log('📁 Found existing folder:', _cachedFolderId);
    return _cachedFolderId;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  _cachedFolderId = createRes.data.id;
  console.log('📁 Created folder:', _cachedFolderId);
  return _cachedFolderId;
};

/**
 * Uploads a file buffer to Google Drive (supports both My Drive and Shared Drives).
 */
const uploadToDrive = async (fileBuffer, originalName, mimeType) => {
  const drive    = getDriveClient();
  const folderId = await getUploadFolderId(drive);

  console.log(`📄 Uploading "${originalName}" (${mimeType}, ${fileBuffer.length} bytes) → folder ${folderId}`);

  const { Readable } = require('stream');

  const { data } = await drive.files.create({
    requestBody: {
      name:    `${Date.now()}_${originalName}`,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: 'id, name',
    // ── Required for Shared Drive support ──
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const fileId = data.id;
  console.log('✅ Drive upload success, file ID:', fileId);

  // Make publicly viewable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
};

module.exports = { uploadToDrive };
