import type { Project } from '../types';
import { PROJECT_IDS, USER_IDS, DATASET_IDS, TRAINING_DATASET_IDS, MODEL_SPEC_IDS, EVALUATION_IDS, TRAINING_RUN_IDS } from './ids';

export const PROJECTS: Project[] = [
  {
    id: PROJECT_IDS.BRAIN_MRI,
    name: 'Brain Tumor MRI Analysis',
    description:
      'Multi-task neuro-oncology project: supervised classification of brain tumors (glioma, meningioma, pituitary adenoma, healthy controls) from T1-weighted MRI, plus unsupervised tissue-subtype discovery via pathology patch clustering.',
    domain: 'Neuro-Oncology',
    createdBy: USER_IDS.ALICE,
    members: [
      { userId: USER_IDS.ALICE, role: 'researcher' },
      { userId: USER_IDS.BOB, role: 'researcher' },
      { userId: USER_IDS.CAROL, role: 'practitioner' },
    ],
    datasetIds: [DATASET_IDS.BRAIN_TEST, TRAINING_DATASET_IDS.BRAIN_TRAIN],
    modelSpecIds: [MODEL_SPEC_IDS.RESNET_BRAIN, MODEL_SPEC_IDS.KMEANS_PATHOLOGY],
    evaluationIds: [EVALUATION_IDS.BRAIN_EXP1, EVALUATION_IDS.BRAIN_EXP2, EVALUATION_IDS.PATHOLOGY_CLUSTER1],
    trainingRunIds: [TRAINING_RUN_IDS.BRAIN_TR1, TRAINING_RUN_IDS.BRAIN_TR2],
    createdAt: '2024-10-15T09:00:00Z',
  },
  {
    id: PROJECT_IDS.ECG,
    name: 'ECG Arrhythmia Detection',
    description:
      'Automated detection and classification of cardiac arrhythmias from 12-lead ECG recordings using deep learning.',
    domain: 'Cardiology',
    createdBy: USER_IDS.BOB,
    members: [
      { userId: USER_IDS.BOB, role: 'researcher' },
      { userId: USER_IDS.DAVE, role: 'practitioner' },
    ],
    datasetIds: [DATASET_IDS.ECG_MAIN, TRAINING_DATASET_IDS.ECG_TRAIN],
    modelSpecIds: [MODEL_SPEC_IDS.BILSTM_ECG],
    evaluationIds: [EVALUATION_IDS.ECG_EXP1],
    trainingRunIds: [TRAINING_RUN_IDS.ECG_TR1],
    createdAt: '2024-11-03T10:30:00Z',
  },
  {
    id: PROJECT_IDS.CLINICAL_NLP,
    name: 'Radiology Report NLP',
    description:
      'Clinical NLP project covering report understanding and generation: ClinicalBERT fine-tuned for 3-class finding classification (positive / negative / uncertain), plus a QLoRA-fine-tuned LLaMA-3 8B for structured radiology report summarization.',
    domain: 'Radiology / NLP',
    createdBy: USER_IDS.ALICE,
    members: [
      { userId: USER_IDS.ALICE, role: 'researcher' },
      { userId: USER_IDS.CAROL, role: 'practitioner' },
    ],
    datasetIds: [DATASET_IDS.NLP_CORPUS, TRAINING_DATASET_IDS.NLP_TRAIN],
    modelSpecIds: [MODEL_SPEC_IDS.BERT_NLP, MODEL_SPEC_IDS.LLAMA_NOTES],
    evaluationIds: [EVALUATION_IDS.NLP_EXP1, EVALUATION_IDS.NOTES_LLM1],
    trainingRunIds: [TRAINING_RUN_IDS.NLP_TR1],
    createdAt: '2024-11-20T14:00:00Z',
  },
];
