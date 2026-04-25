// Entry point untuk local development
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server CodeLingo jalan di http://localhost:${PORT}`);
  console.log(`   API tersedia di http://localhost:${PORT}/api`);
});
