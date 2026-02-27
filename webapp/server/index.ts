import express from 'express';
import cors from 'cors';
import { scheduleRouter } from './routes/schedule';
import { exportRouter } from './routes/export';
import { settingsRouter } from './routes/settings';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/schedule', scheduleRouter);
app.use('/api/export', exportRouter);
app.use('/api/settings', settingsRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
