export interface ReportData {
  title: string;
  typeAndMarket: string;
  pros: string;
  risks: string;
  costs: string;
  nextSteps: string;
  founderExperience: string; // 新增：创始人从0到1落地经验
  survivalGuide: string;     // 新增：极简生存指南
  score: {
    total: number;
    details: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface VerificationResponse {
  valid: boolean;
  message?: string;
}