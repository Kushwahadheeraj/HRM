import { Request, Response } from 'express';
import Recruitment from '../models/Recruitment.model';
import Candidate from '../models/Candidate.model';
import { ApiResponse } from '../types';

export const getJobs = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { status, department } = req.query;
    let query: any = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (status) query.status = status;
    if (department) query.department = department;
    const jobs = await Recruitment.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getJobById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const job = await Recruitment.findOne(filter);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get Job By Id Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createJob = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const jobData = { ...req.body, organizationId: req.organizationId };
    const newJob = await Recruitment.create(jobData);
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: newJob,
    });
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateJob = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedJob = await Recruitment.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error) {
    console.error('Update Job Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteJob = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const deletedJob = await Recruitment.findOneAndDelete(filter);
    if (!deletedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete Job Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Candidates
export const getCandidates = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { stage, source } = req.query;
    let query: any = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (stage) query.stage = stage;
    if (source) query.source = source;
    const candidates = await Candidate.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    console.error('Get Candidates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getCandidateById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const candidate = await Candidate.findOne(filter);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error('Get Candidate By Id Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createCandidate = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const candidateData = { ...req.body, organizationId: req.organizationId };
    const newCandidate = await Candidate.create(candidateData);
    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: newCandidate,
    });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateCandidate = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedCandidate = await Candidate.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
    res.json({
      success: true,
      message: 'Candidate updated successfully',
      data: updatedCandidate,
    });
  } catch (error) {
    console.error('Update Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteCandidate = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const deletedCandidate = await Candidate.findOneAndDelete(filter);
    if (!deletedCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
    res.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    console.error('Delete Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const candidateFilter: any = {};
    if (req.organizationId) candidateFilter.organizationId = req.organizationId;
    // Pipeline Data
    const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    const pipelineData = await Promise.all(stages.map(async (stage) => {
      const count = await Candidate.countDocuments({ ...candidateFilter, stage });
      const colors = ['#3B82F6', '#60A5FA', '#F97316', '#10B981', '#8B5CF6'];
      const index = stages.indexOf(stage);
      return {
        stage,
        count,
        color: colors[index]
      };
    }));

    // Source Data
    const sources = ['LinkedIn', 'Referral', 'Website', 'Job Board', 'Other'];
    const sourceData = await Promise.all(sources.map(async (source) => {
      const count = await Candidate.countDocuments({ ...candidateFilter, source });
      const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#64748B'];
      const index = sources.indexOf(source);
      return {
        name: source,
        value: count,
        color: colors[index]
      };
    }));

    // Calculate percentages for source data
    const totalSourceCount = sourceData.reduce((sum, s) => sum + s.value, 0);
    const sourceDataWithPercentages = sourceData.map(s => ({
      ...s,
      value: totalSourceCount > 0 ? Math.round((s.value / totalSourceCount) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        pipelineData,
        sourceData: sourceDataWithPercentages
      }
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
