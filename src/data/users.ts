import type { User } from '../types';
import { USER_IDS } from './ids';

export const USERS: User[] = [
  {
    id: USER_IDS.ALICE,
    username: 'alice.chen',
    name: 'Dr. Alice Chen',
    role: 'researcher',
    affiliation: 'Dept. of Radiology, UNC',
  },
  {
    id: USER_IDS.BOB,
    username: 'bob.kim',
    name: 'Bob Kim, PhD',
    role: 'researcher',
    affiliation: 'Dept. of Biomedical Engineering, UNC',
  },
  {
    id: USER_IDS.CAROL,
    username: 'carol.martinez',
    name: 'Dr. Carol Martinez',
    role: 'practitioner',
    affiliation: 'Division of Neuro-Oncology, UNC',
  },
  {
    id: USER_IDS.DAVE,
    username: 'dave.nguyen',
    name: 'Dave Nguyen, NP',
    role: 'practitioner',
    affiliation: 'Dept. of Cardiology, UNC',
  },
];
