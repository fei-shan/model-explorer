import express from 'express';
import cors from 'cors';
import { COLLECTIONS } from './firestore.js';
import { collectionRoutes } from './routes/collectionRoutes.js';
import { datasetEntriesRoutes } from './routes/datasetEntries.js';
import { trainingRunTriggerRoutes } from './routes/trainingRunTrigger.js';
import { evaluationTriggerRoutes } from './routes/evaluationTrigger.js';
import { apiKeyGate } from './auth.js';
import * as evaluationMatrix from './serialize/evaluationMatrix.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(apiKeyGate);

app.use('/datasets', datasetEntriesRoutes());
app.use('/projects', trainingRunTriggerRoutes());
app.use('/projects', evaluationTriggerRoutes());

for (const name of COLLECTIONS) {
  const options = name === 'evaluations' ? evaluationMatrix : {};
  app.use(`/${name}`, collectionRoutes(name, options));
}

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`model-explorer-api listening on :${port}`);
});
