import express from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getDashboardStats,
} from '../controllers/recruitment.controller';

const router = express.Router();

// Jobs
router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

// Candidates
router.get('/candidates/list', getCandidates);
router.get('/candidates/:id', getCandidateById);
router.post('/candidates', createCandidate);
router.put('/candidates/:id', updateCandidate);
router.delete('/candidates/:id', deleteCandidate);

// Dashboard Stats
router.get('/dashboard/stats', getDashboardStats);

export default router;
