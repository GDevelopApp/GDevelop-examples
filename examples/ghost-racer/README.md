"Ghost Racer" is similar to a 2D Fall Guys game, with a completely rewritten RecordMovements extension that allows asynchronous multiplayer gameplay.  This means you can play against the saved movements of yourself or others (powered by Google Firebase Firestore Database).

When setting up Firebase, protect your data by only allowing users to add new documents.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Match any document in the database
    match /{document=**} {
      
      // Allow all users to read any document
      allow read: if true;
      
      // Allow all users (including unauthenticated) to create new documents
      allow create: if true;

      // Disallow any user from updating or deleting documents
      allow update, delete: if false;
    }
  }
}
