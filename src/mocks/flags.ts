import type { Flag } from '../types';
import { FLAG_IDS, EVALUATION_IDS, USER_IDS } from './ids';

export const FLAGS: Flag[] = [
  {
    id: FLAG_IDS.FLAG1,
    entryId: 'en-b08',
    subjectId: 'sub-008',
    sessionId: 'ses-001',
    evaluationId: EVALUATION_IDS.BRAIN_EXP2,
    raisedBy: USER_IDS.ALICE,
    reason:
      'Pituitary case misclassified as Glioma in both v1.0 and v1.1. Sub-008 is a 44M with an unusual pituitary macroadenoma morphology. Possible atypical presentation or acquisition artifact — recommend clinical review.',
    status: 'open',
    insights: [],
    createdAt: '2024-12-04T09:15:00Z',
  },
  {
    id: FLAG_IDS.FLAG2,
    entryId: 'en-b11',
    subjectId: 'sub-011',
    sessionId: 'ses-001',
    evaluationId: EVALUATION_IDS.BRAIN_EXP2,
    raisedBy: USER_IDS.ALICE,
    reason:
      'Meningioma misclassified as Healthy in both experiments. Model may not detect subtle meningioma presentations with minimal mass effect.',
    status: 'commented',
    insights: [
      {
        providedBy: USER_IDS.CAROL,
        comment:
          'Reviewed sub-011 chart. This 72F patient had an atypical meningioma with minimal mass effect — the diagnosis was initially uncertain even to our neuro-radiologist. Scan quality was suboptimal due to patient motion artifacts. Recommend re-acquisition before re-annotation. Given the rarity of this presentation, I do not expect this failure mode to significantly impact clinical adoption, but it should be documented.',
        createdAt: '2024-12-05T14:30:00Z',
      },
    ],
    createdAt: '2024-12-04T09:22:00Z',
  },
  {
    id: FLAG_IDS.FLAG3,
    entryId: 'en-e04',
    subjectId: 'sub-104',
    sessionId: 'ses-001',
    evaluationId: EVALUATION_IDS.ECG_EXP1,
    raisedBy: USER_IDS.DAVE,
    reason:
      'Bradycardia missed — predicted Normal with 63% confidence. Sub-104 is a 78F with documented symptomatic bradycardia. If deployed as a screening tool, this miss would have clinical consequences.',
    status: 'open',
    insights: [],
    createdAt: '2024-12-01T11:00:00Z',
  },
  {
    id: FLAG_IDS.FLAG4,
    entryId: 'en-b19',
    subjectId: 'sub-019',
    sessionId: 'ses-001',
    evaluationId: EVALUATION_IDS.BRAIN_EXP2,
    raisedBy: USER_IDS.BOB,
    reason:
      'Elderly Healthy patient (74F, sub-019) misclassified as Glioma. Cortical atrophy may produce features similar to infiltrative glioma on T1w imaging. Potential age-related bias in training distribution.',
    status: 'dismissed',
    insights: [],
    dismissedBy: USER_IDS.ALICE,
    dismissedAt: '2024-12-06T10:00:00Z',
    createdAt: '2024-12-04T15:45:00Z',
  },
];
