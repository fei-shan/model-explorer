export const USER_IDS = {
  ALICE: 'u-alice',
  BOB: 'u-bob',
  CAROL: 'u-carol',
  DAVE: 'u-dave',
} as const;

export const PROJECT_IDS = {
  BRAIN_MRI: 'p-brain-mri',
  ECG: 'p-ecg',
  CLINICAL_NLP: 'p-clinical-nlp',
} as const;

export const DATASET_IDS = {
  BRAIN_TEST: 'd-brain-test',
  ECG_MAIN: 'd-ecg-main',
  NLP_CORPUS: 'd-nlp-corpus',
} as const;

export const MODEL_SPEC_IDS = {
  RESNET_BRAIN: 'ms-resnet-brain',
  BILSTM_ECG: 'ms-bilstm-ecg',
  BERT_NLP: 'ms-bert-nlp',
} as const;

export const WEIGHT_IDS = {
  RESNET_V1: 'w-resnet-v1',
  RESNET_V2: 'w-resnet-v2',
  BILSTM_V1: 'w-bilstm-v1',
  BERT_V1: 'w-bert-v1',
} as const;

export const EVALUATION_IDS = {
  BRAIN_EXP1: 'e-brain-1',
  BRAIN_EXP2: 'e-brain-2',
  ECG_EXP1: 'e-ecg-1',
  NLP_EXP1: 'e-nlp-1',
} as const;

export const TRAINING_RUN_IDS = {
  BRAIN_TR1: 'tr-brain-1',
  BRAIN_TR2: 'tr-brain-2',
  ECG_TR1: 'tr-ecg-1',
  NLP_TR1: 'tr-nlp-1',
} as const;

export const TRAINING_DATASET_IDS = {
  BRAIN_TRAIN: 'd-brain-train',
  ECG_TRAIN: 'd-ecg-train',
  NLP_TRAIN: 'd-nlp-train',
} as const;

export const FLAG_IDS = {
  FLAG1: 'f-001',
  FLAG2: 'f-002',
  FLAG3: 'f-003',
  FLAG4: 'f-004',
} as const;
