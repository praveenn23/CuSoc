const mongoose = require('../cusoc backend new/node_modules/mongoose');
const uri = "mongodb+srv://praveenkumarrr04:saheel2003@cluster0.ubcrlh0.mongodb.net/abhyutthanam?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const collections = await db.collections();
  let found = false;
  for (let collection of collections) {
    const docs = await collection.find({
      $or: [
        { name: { $regex: /sujal/i } },
        { leaderName: { $regex: /sujal/i } },
        { member1Name: { $regex: /sujal/i } },
        { member2Name: { $regex: /sujal/i } },
        { member3Name: { $regex: /sujal/i } },
        { member4Name: { $regex: /sujal/i } },
        { email: { $regex: /sujal/i } },
        { "members.name": { $regex: /sujal/i } },
        { "member1.name": { $regex: /sujal/i } }
      ]
    }).toArray();
    
    if (docs.length > 0) {
      console.log(`\n--- Found ${docs.length} matching document(s) in collection: ${collection.collectionName} ---`);
      docs.forEach(doc => {
          console.log(`_id: ${doc._id}, name: ${doc.name || doc.leaderName}, email: ${doc.email}, createdAt: ${doc.createdAt}, status: ${doc.status}`);
          console.log(JSON.stringify(doc, null, 2));
      });
      found = true;
    }
  }

  if (!found) {
    console.log("Not found with specific fields, trying stringify search on all docs... (this might be slow)");
    for (let collection of collections) {
        const allDocs = await collection.find({}).toArray();
        const matching = allDocs.filter(doc => JSON.stringify(doc).toLowerCase().includes("sujal"));
        if (matching.length > 0) {
            console.log(`\n--- Found via stringify in collection: ${collection.collectionName} ---`);
            matching.forEach(doc => console.log(JSON.stringify(doc, null, 2)));
            found = true;
        }
    }
  }

  if (!found) console.log("NO TRACE OF SUJAL DUREJA IN THE DATABASE.");

  await mongoose.disconnect();
}

run().catch(console.dir);
