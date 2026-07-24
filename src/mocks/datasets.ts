import type { Dataset, Entry } from '../types';
import { DATASET_IDS, TRAINING_DATASET_IDS, PROJECT_IDS } from './ids';

const BRAIN_ENTRIES: Entry[] = [
  { id: 'en-b01', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-001', sessionId: 'ses-001', date: '2024-09-01', age: 45, sex: 'F', diagnosis: 'Glioma',      modalityType: 'MRI', imagePath: '/data/mri/sub-001_T1w.nii.gz' },
  { id: 'en-b02', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-002', sessionId: 'ses-001', date: '2024-09-02', age: 67, sex: 'M', diagnosis: 'Meningioma',  modalityType: 'MRI', imagePath: '/data/mri/sub-002_T1w.nii.gz' },
  { id: 'en-b03', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-003', sessionId: 'ses-001', date: '2024-09-03', age: 52, sex: 'F', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-003_T1w.nii.gz' },
  { id: 'en-b04', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-004', sessionId: 'ses-001', date: '2024-09-04', age: 71, sex: 'M', diagnosis: 'Pituitary',   modalityType: 'MRI', imagePath: '/data/mri/sub-004_T1w.nii.gz' },
  { id: 'en-b05', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-005', sessionId: 'ses-001', date: '2024-09-05', age: 38, sex: 'F', diagnosis: 'Glioma',      modalityType: 'MRI', imagePath: '/data/mri/sub-005_T1w.nii.gz' },
  { id: 'en-b06', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-006', sessionId: 'ses-001', date: '2024-09-08', age: 63, sex: 'M', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-006_T1w.nii.gz' },
  { id: 'en-b07', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-007', sessionId: 'ses-001', date: '2024-09-09', age: 55, sex: 'F', diagnosis: 'Meningioma',  modalityType: 'MRI', imagePath: '/data/mri/sub-007_T1w.nii.gz' },
  { id: 'en-b08', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-008', sessionId: 'ses-001', date: '2024-09-10', age: 44, sex: 'M', diagnosis: 'Pituitary',   modalityType: 'MRI', imagePath: '/data/mri/sub-008_T1w.nii.gz' },
  { id: 'en-b09', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-009', sessionId: 'ses-001', date: '2024-09-11', age: 29, sex: 'F', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-009_T1w.nii.gz' },
  { id: 'en-b10', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-010', sessionId: 'ses-001', date: '2024-09-12', age: 58, sex: 'M', diagnosis: 'Glioma',      modalityType: 'MRI', imagePath: '/data/mri/sub-010_T1w.nii.gz' },
  { id: 'en-b11', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-011', sessionId: 'ses-001', date: '2024-09-15', age: 72, sex: 'F', diagnosis: 'Meningioma',  modalityType: 'MRI', imagePath: '/data/mri/sub-011_T1w.nii.gz' },
  { id: 'en-b12', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-012', sessionId: 'ses-001', date: '2024-09-16', age: 35, sex: 'M', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-012_T1w.nii.gz' },
  { id: 'en-b13', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-013', sessionId: 'ses-001', date: '2024-09-17', age: 61, sex: 'F', diagnosis: 'Glioma',      modalityType: 'MRI', imagePath: '/data/mri/sub-013_T1w.nii.gz' },
  { id: 'en-b14', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-014', sessionId: 'ses-001', date: '2024-09-18', age: 49, sex: 'M', diagnosis: 'Pituitary',   modalityType: 'MRI', imagePath: '/data/mri/sub-014_T1w.nii.gz' },
  { id: 'en-b15', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-015', sessionId: 'ses-001', date: '2024-09-19', age: 53, sex: 'F', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-015_T1w.nii.gz' },
  { id: 'en-b16', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-016', sessionId: 'ses-001', date: '2024-09-22', age: 66, sex: 'M', diagnosis: 'Meningioma',  modalityType: 'MRI', imagePath: '/data/mri/sub-016_T1w.nii.gz' },
  { id: 'en-b17', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-017', sessionId: 'ses-001', date: '2024-09-23', age: 41, sex: 'F', diagnosis: 'Glioma',      modalityType: 'MRI', imagePath: '/data/mri/sub-017_T1w.nii.gz' },
  { id: 'en-b18', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-018', sessionId: 'ses-001', date: '2024-09-24', age: 58, sex: 'M', diagnosis: 'Pituitary',   modalityType: 'MRI', imagePath: '/data/mri/sub-018_T1w.nii.gz' },
  { id: 'en-b19', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-019', sessionId: 'ses-001', date: '2024-09-25', age: 74, sex: 'F', diagnosis: 'Healthy',     modalityType: 'MRI', imagePath: '/data/mri/sub-019_T1w.nii.gz' },
  { id: 'en-b20', datasetId: DATASET_IDS.BRAIN_TEST, subjectId: 'sub-020', sessionId: 'ses-001', date: '2024-09-26', age: 47, sex: 'M', diagnosis: 'Meningioma',  modalityType: 'MRI', imagePath: '/data/mri/sub-020_T1w.nii.gz' },
];

const ECG_ENTRIES: Entry[] = [
  { id: 'en-e01', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-101', sessionId: 'ses-001', date: '2024-10-01', age: 52, sex: 'M', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-101_12lead.edf' },
  { id: 'en-e02', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-102', sessionId: 'ses-001', date: '2024-10-02', age: 67, sex: 'F', diagnosis: 'A-Fib',        modalityType: 'ECG', imagePath: '/data/ecg/sub-102_12lead.edf' },
  { id: 'en-e03', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-103', sessionId: 'ses-001', date: '2024-10-03', age: 43, sex: 'M', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-103_12lead.edf' },
  { id: 'en-e04', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-104', sessionId: 'ses-001', date: '2024-10-04', age: 78, sex: 'F', diagnosis: 'Bradycardia',  modalityType: 'ECG', imagePath: '/data/ecg/sub-104_12lead.edf' },
  { id: 'en-e05', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-105', sessionId: 'ses-001', date: '2024-10-05', age: 55, sex: 'M', diagnosis: 'A-Fib',        modalityType: 'ECG', imagePath: '/data/ecg/sub-105_12lead.edf' },
  { id: 'en-e06', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-106', sessionId: 'ses-001', date: '2024-10-08', age: 61, sex: 'F', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-106_12lead.edf' },
  { id: 'en-e07', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-107', sessionId: 'ses-001', date: '2024-10-09', age: 49, sex: 'M', diagnosis: 'Tachycardia',  modalityType: 'ECG', imagePath: '/data/ecg/sub-107_12lead.edf' },
  { id: 'en-e08', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-108', sessionId: 'ses-001', date: '2024-10-10', age: 72, sex: 'F', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-108_12lead.edf' },
  { id: 'en-e09', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-109', sessionId: 'ses-001', date: '2024-10-11', age: 38, sex: 'M', diagnosis: 'A-Fib',        modalityType: 'ECG', imagePath: '/data/ecg/sub-109_12lead.edf' },
  { id: 'en-e10', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-110', sessionId: 'ses-001', date: '2024-10-12', age: 65, sex: 'F', diagnosis: 'Bradycardia',  modalityType: 'ECG', imagePath: '/data/ecg/sub-110_12lead.edf' },
  { id: 'en-e11', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-111', sessionId: 'ses-001', date: '2024-10-15', age: 57, sex: 'M', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-111_12lead.edf' },
  { id: 'en-e12', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-112', sessionId: 'ses-001', date: '2024-10-16', age: 44, sex: 'F', diagnosis: 'Tachycardia',  modalityType: 'ECG', imagePath: '/data/ecg/sub-112_12lead.edf' },
  { id: 'en-e13', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-113', sessionId: 'ses-001', date: '2024-10-17', age: 70, sex: 'M', diagnosis: 'A-Fib',        modalityType: 'ECG', imagePath: '/data/ecg/sub-113_12lead.edf' },
  { id: 'en-e14', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-114', sessionId: 'ses-001', date: '2024-10-18', age: 51, sex: 'F', diagnosis: 'Normal',       modalityType: 'ECG', imagePath: '/data/ecg/sub-114_12lead.edf' },
  { id: 'en-e15', datasetId: DATASET_IDS.ECG_MAIN, subjectId: 'sub-115', sessionId: 'ses-001', date: '2024-10-19', age: 63, sex: 'M', diagnosis: 'Bradycardia',  modalityType: 'ECG', imagePath: '/data/ecg/sub-115_12lead.edf' },
];

const NLP_ENTRIES: Entry[] = [
  { id: 'en-n01', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-201', sessionId: 'ses-001', date: '2024-11-01', age: 55, sex: 'M', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-201_report.txt' },
  { id: 'en-n02', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-202', sessionId: 'ses-001', date: '2024-11-02', age: 67, sex: 'F', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-202_report.txt' },
  { id: 'en-n03', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-203', sessionId: 'ses-001', date: '2024-11-03', age: 43, sex: 'M', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-203_report.txt' },
  { id: 'en-n04', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-204', sessionId: 'ses-001', date: '2024-11-04', age: 72, sex: 'F', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-204_report.txt' },
  { id: 'en-n05', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-205', sessionId: 'ses-001', date: '2024-11-05', age: 38, sex: 'M', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-205_report.txt' },
  { id: 'en-n06', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-206', sessionId: 'ses-001', date: '2024-11-08', age: 61, sex: 'F', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-206_report.txt' },
  { id: 'en-n07', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-207', sessionId: 'ses-001', date: '2024-11-09', age: 49, sex: 'M', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-207_report.txt' },
  { id: 'en-n08', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-208', sessionId: 'ses-001', date: '2024-11-10', age: 53, sex: 'F', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-208_report.txt' },
  { id: 'en-n09', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-209', sessionId: 'ses-001', date: '2024-11-11', age: 65, sex: 'M', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-209_report.txt' },
  { id: 'en-n10', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-210', sessionId: 'ses-001', date: '2024-11-12', age: 44, sex: 'F', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-210_report.txt' },
  { id: 'en-n11', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-211', sessionId: 'ses-001', date: '2024-11-15', age: 70, sex: 'M', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-211_report.txt' },
  { id: 'en-n12', datasetId: DATASET_IDS.NLP_CORPUS, subjectId: 'sub-212', sessionId: 'ses-001', date: '2024-11-16', age: 58, sex: 'F', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/nlp/sub-212_report.txt' },
];

export const DATASETS: Dataset[] = [
  {
    id: DATASET_IDS.BRAIN_TEST,
    projectId: PROJECT_IDS.BRAIN_MRI,
    name: 'Brain Tumor MRI — Test Set',
    description: 'Hold-out test set of 20 T1-weighted MRI scans from UNC Neurology (Aug–Sep 2024). De-identified per IRB #24-0891.',
    modalities: ['MRI'],
    labelSet: ['Healthy', 'Glioma', 'Meningioma', 'Pituitary'],
    entries: BRAIN_ENTRIES,
    createdAt: '2024-10-10T08:00:00Z',
    role: 'evaluation',
  },
  {
    id: DATASET_IDS.ECG_MAIN,
    projectId: PROJECT_IDS.ECG,
    name: 'ECG Arrhythmia Dataset',
    description: '15 de-identified 12-lead ECG recordings from UNC Cardiology (Oct 2024). Annotated by two board-certified cardiologists.',
    modalities: ['ECG'],
    labelSet: ['Normal', 'A-Fib', 'Bradycardia', 'Tachycardia'],
    entries: ECG_ENTRIES,
    createdAt: '2024-11-01T08:00:00Z',
    role: 'evaluation',
  },
  {
    id: DATASET_IDS.NLP_CORPUS,
    projectId: PROJECT_IDS.CLINICAL_NLP,
    name: 'Radiology Reports Corpus',
    description: '12 de-identified radiology reports from UNC Imaging (Nov 2024). Annotated by board-certified radiologists.',
    modalities: ['Clinical Note'],
    labelSet: ['Positive', 'Negative', 'Uncertain'],
    entries: NLP_ENTRIES,
    createdAt: '2024-11-18T08:00:00Z',
    role: 'evaluation',
  },
];

// ── Training datasets ─────────────────────────────────────────────────────────────

const BRAIN_TRAIN_ENTRIES: Entry[] = [
  // ── Train split (16 entries) ──
  { id: 'tr-b01', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t001', sessionId: 'ses-001', date: '2024-07-01', age: 55, sex: 'M', diagnosis: 'Glioma',     modalityType: 'MRI', imagePath: '/data/train/mri/sub-t001_T1w.nii.gz', split: 'train' },
  { id: 'tr-b02', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t002', sessionId: 'ses-001', date: '2024-07-02', age: 42, sex: 'F', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t002_T1w.nii.gz', split: 'train' },
  { id: 'tr-b03', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t003', sessionId: 'ses-001', date: '2024-07-03', age: 68, sex: 'M', diagnosis: 'Meningioma', modalityType: 'MRI', imagePath: '/data/train/mri/sub-t003_T1w.nii.gz', split: 'train' },
  { id: 'tr-b04', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t004', sessionId: 'ses-001', date: '2024-07-04', age: 50, sex: 'F', diagnosis: 'Pituitary',  modalityType: 'MRI', imagePath: '/data/train/mri/sub-t004_T1w.nii.gz', split: 'train' },
  { id: 'tr-b05', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t005', sessionId: 'ses-001', date: '2024-07-05', age: 37, sex: 'M', diagnosis: 'Glioma',     modalityType: 'MRI', imagePath: '/data/train/mri/sub-t005_T1w.nii.gz', split: 'train' },
  { id: 'tr-b06', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t006', sessionId: 'ses-001', date: '2024-07-08', age: 61, sex: 'F', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t006_T1w.nii.gz', split: 'train' },
  { id: 'tr-b07', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t007', sessionId: 'ses-001', date: '2024-07-09', age: 73, sex: 'M', diagnosis: 'Meningioma', modalityType: 'MRI', imagePath: '/data/train/mri/sub-t007_T1w.nii.gz', split: 'train' },
  { id: 'tr-b08', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t008', sessionId: 'ses-001', date: '2024-07-10', age: 48, sex: 'F', diagnosis: 'Pituitary',  modalityType: 'MRI', imagePath: '/data/train/mri/sub-t008_T1w.nii.gz', split: 'train' },
  { id: 'tr-b09', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t009', sessionId: 'ses-001', date: '2024-07-11', age: 33, sex: 'M', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t009_T1w.nii.gz', split: 'train' },
  { id: 'tr-b10', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t010', sessionId: 'ses-001', date: '2024-07-12', age: 59, sex: 'F', diagnosis: 'Glioma',     modalityType: 'MRI', imagePath: '/data/train/mri/sub-t010_T1w.nii.gz', split: 'train' },
  { id: 'tr-b11', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t011', sessionId: 'ses-001', date: '2024-07-15', age: 65, sex: 'M', diagnosis: 'Meningioma', modalityType: 'MRI', imagePath: '/data/train/mri/sub-t011_T1w.nii.gz', split: 'train' },
  { id: 'tr-b12', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t012', sessionId: 'ses-001', date: '2024-07-16', age: 44, sex: 'F', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t012_T1w.nii.gz', split: 'train' },
  { id: 'tr-b13', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t013', sessionId: 'ses-001', date: '2024-07-17', age: 57, sex: 'M', diagnosis: 'Glioma',     modalityType: 'MRI', imagePath: '/data/train/mri/sub-t013_T1w.nii.gz', split: 'train' },
  { id: 'tr-b14', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t014', sessionId: 'ses-001', date: '2024-07-18', age: 70, sex: 'F', diagnosis: 'Pituitary',  modalityType: 'MRI', imagePath: '/data/train/mri/sub-t014_T1w.nii.gz', split: 'train' },
  { id: 'tr-b15', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t015', sessionId: 'ses-001', date: '2024-07-19', age: 40, sex: 'M', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t015_T1w.nii.gz', split: 'train' },
  { id: 'tr-b16', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t016', sessionId: 'ses-001', date: '2024-07-22', age: 62, sex: 'F', diagnosis: 'Meningioma', modalityType: 'MRI', imagePath: '/data/train/mri/sub-t016_T1w.nii.gz', split: 'train' },
  // ── Val split (4 entries) ──
  { id: 'tr-b17', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t017', sessionId: 'ses-001', date: '2024-07-23', age: 47, sex: 'M', diagnosis: 'Glioma',     modalityType: 'MRI', imagePath: '/data/train/mri/sub-t017_T1w.nii.gz', split: 'val' },
  { id: 'tr-b18', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t018', sessionId: 'ses-001', date: '2024-07-24', age: 69, sex: 'F', diagnosis: 'Healthy',    modalityType: 'MRI', imagePath: '/data/train/mri/sub-t018_T1w.nii.gz', split: 'val' },
  { id: 'tr-b19', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t019', sessionId: 'ses-001', date: '2024-07-25', age: 53, sex: 'M', diagnosis: 'Meningioma', modalityType: 'MRI', imagePath: '/data/train/mri/sub-t019_T1w.nii.gz', split: 'val' },
  { id: 'tr-b20', datasetId: TRAINING_DATASET_IDS.BRAIN_TRAIN, subjectId: 'sub-t020', sessionId: 'ses-001', date: '2024-07-26', age: 76, sex: 'F', diagnosis: 'Pituitary',  modalityType: 'MRI', imagePath: '/data/train/mri/sub-t020_T1w.nii.gz', split: 'val' },
];

const ECG_TRAIN_ENTRIES: Entry[] = [
  { id: 'tr-e01', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t101', sessionId: 'ses-001', date: '2024-08-01', age: 58, sex: 'M', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t101.edf', split: 'train' },
  { id: 'tr-e02', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t102', sessionId: 'ses-001', date: '2024-08-02', age: 70, sex: 'F', diagnosis: 'A-Fib',       modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t102.edf', split: 'train' },
  { id: 'tr-e03', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t103', sessionId: 'ses-001', date: '2024-08-03', age: 45, sex: 'M', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t103.edf', split: 'train' },
  { id: 'tr-e04', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t104', sessionId: 'ses-001', date: '2024-08-04', age: 62, sex: 'F', diagnosis: 'Bradycardia', modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t104.edf', split: 'train' },
  { id: 'tr-e05', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t105', sessionId: 'ses-001', date: '2024-08-05', age: 53, sex: 'M', diagnosis: 'A-Fib',       modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t105.edf', split: 'train' },
  { id: 'tr-e06', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t106', sessionId: 'ses-001', date: '2024-08-08', age: 66, sex: 'F', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t106.edf', split: 'train' },
  { id: 'tr-e07', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t107', sessionId: 'ses-001', date: '2024-08-09', age: 41, sex: 'M', diagnosis: 'Tachycardia', modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t107.edf', split: 'train' },
  { id: 'tr-e08', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t108', sessionId: 'ses-001', date: '2024-08-10', age: 75, sex: 'F', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t108.edf', split: 'train' },
  { id: 'tr-e09', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t109', sessionId: 'ses-001', date: '2024-08-11', age: 48, sex: 'M', diagnosis: 'A-Fib',       modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t109.edf', split: 'train' },
  { id: 'tr-e10', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t110', sessionId: 'ses-001', date: '2024-08-12', age: 60, sex: 'F', diagnosis: 'Bradycardia', modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t110.edf', split: 'train' },
  { id: 'tr-e11', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t111', sessionId: 'ses-001', date: '2024-08-15', age: 55, sex: 'M', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t111.edf', split: 'train' },
  { id: 'tr-e12', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t112', sessionId: 'ses-001', date: '2024-08-16', age: 43, sex: 'F', diagnosis: 'Tachycardia', modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t112.edf', split: 'train' },
  // ── Val split (3 entries) ──
  { id: 'tr-e13', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t113', sessionId: 'ses-001', date: '2024-08-17', age: 67, sex: 'M', diagnosis: 'A-Fib',       modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t113.edf', split: 'val' },
  { id: 'tr-e14', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t114', sessionId: 'ses-001', date: '2024-08-18', age: 52, sex: 'F', diagnosis: 'Normal',      modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t114.edf', split: 'val' },
  { id: 'tr-e15', datasetId: TRAINING_DATASET_IDS.ECG_TRAIN, subjectId: 'sub-t115', sessionId: 'ses-001', date: '2024-08-19', age: 71, sex: 'M', diagnosis: 'Bradycardia', modalityType: 'ECG', imagePath: '/data/train/ecg/sub-t115.edf', split: 'val' },
];

const NLP_TRAIN_ENTRIES: Entry[] = [
  { id: 'tr-n01', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t201', sessionId: 'ses-001', date: '2024-09-01', age: 57, sex: 'F', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t201.txt', split: 'train' },
  { id: 'tr-n02', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t202', sessionId: 'ses-001', date: '2024-09-02', age: 64, sex: 'M', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t202.txt', split: 'train' },
  { id: 'tr-n03', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t203', sessionId: 'ses-001', date: '2024-09-03', age: 48, sex: 'F', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t203.txt', split: 'train' },
  { id: 'tr-n04', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t204', sessionId: 'ses-001', date: '2024-09-04', age: 71, sex: 'M', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t204.txt', split: 'train' },
  { id: 'tr-n05', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t205', sessionId: 'ses-001', date: '2024-09-05', age: 39, sex: 'F', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t205.txt', split: 'train' },
  { id: 'tr-n06', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t206', sessionId: 'ses-001', date: '2024-09-08', age: 55, sex: 'M', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t206.txt', split: 'train' },
  { id: 'tr-n07', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t207', sessionId: 'ses-001', date: '2024-09-09', age: 62, sex: 'F', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t207.txt', split: 'train' },
  { id: 'tr-n08', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t208', sessionId: 'ses-001', date: '2024-09-10', age: 46, sex: 'M', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t208.txt', split: 'train' },
  { id: 'tr-n09', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t209', sessionId: 'ses-001', date: '2024-09-11', age: 69, sex: 'F', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t209.txt', split: 'train' },
  { id: 'tr-n10', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t210', sessionId: 'ses-001', date: '2024-09-12', age: 43, sex: 'M', diagnosis: 'Uncertain', modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t210.txt', split: 'train' },
  // ── Val split (2 entries) ──
  { id: 'tr-n11', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t211', sessionId: 'ses-001', date: '2024-09-15', age: 58, sex: 'F', diagnosis: 'Positive',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t211.txt', split: 'val' },
  { id: 'tr-n12', datasetId: TRAINING_DATASET_IDS.NLP_TRAIN, subjectId: 'sub-t212', sessionId: 'ses-001', date: '2024-09-16', age: 74, sex: 'M', diagnosis: 'Negative',  modalityType: 'Clinical Note', imagePath: '/data/train/nlp/sub-t212.txt', split: 'val' },
];

export const TRAINING_DATASETS: Dataset[] = [
  {
    id: TRAINING_DATASET_IDS.BRAIN_TRAIN,
    projectId: PROJECT_IDS.BRAIN_MRI,
    name: 'Brain Tumor MRI — Training Set',
    description: 'Training cohort of 20 T1-weighted MRI scans (16 train / 4 val). Collected Jul–Aug 2024, UNC Neurology. IRB #24-0891.',
    modalities: ['MRI'],
    labelSet: ['Healthy', 'Glioma', 'Meningioma', 'Pituitary'],
    entries: BRAIN_TRAIN_ENTRIES,
    createdAt: '2024-10-08T08:00:00Z',
    role: 'training',
  },
  {
    id: TRAINING_DATASET_IDS.ECG_TRAIN,
    projectId: PROJECT_IDS.ECG,
    name: 'ECG Arrhythmia — Training Set',
    description: 'Training cohort of 15 ECG recordings (12 train / 3 val). Collected Aug 2024, UNC Cardiology.',
    modalities: ['ECG'],
    labelSet: ['Normal', 'A-Fib', 'Bradycardia', 'Tachycardia'],
    entries: ECG_TRAIN_ENTRIES,
    createdAt: '2024-10-28T08:00:00Z',
    role: 'training',
  },
  {
    id: TRAINING_DATASET_IDS.NLP_TRAIN,
    projectId: PROJECT_IDS.CLINICAL_NLP,
    name: 'Radiology Reports — Training Set',
    description: 'Training corpus of 12 radiology reports (10 train / 2 val). Collected Sep 2024, UNC Imaging.',
    modalities: ['Clinical Note'],
    labelSet: ['Positive', 'Negative', 'Uncertain'],
    entries: NLP_TRAIN_ENTRIES,
    createdAt: '2024-11-15T08:00:00Z',
    role: 'training',
  },
];
