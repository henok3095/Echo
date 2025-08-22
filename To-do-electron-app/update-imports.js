const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/TasksPage.jsx',
  'src/pages/ProfilePage.jsx',
  'src/pages/MusicPage_clean.jsx',
  'src/pages/MusicPage.jsx',
  'src/pages/MoviesPage.jsx',
  'src/pages/MemoriesPage.jsx',
  'src/pages/MediaPage.jsx',
  'src/pages/LocalMusicLibraryPage.jsx',
  'src/pages/LastfmPage.jsx',
  'src/pages/JournalPage.jsx',
  'src/pages/DashboardPage.jsx',
  'src/pages/CalendarPage.jsx',
  'src/components/AuthModal.jsx',
  'src/app.jsx'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const updatedContent = content.replace(
      /from ['"]\.\.?\/store['"]/g, 
      "from '../store/index.jsx'"
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Import updates complete!');
