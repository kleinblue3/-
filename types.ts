export interface ReportData {
  title: string;
  typeAndMarket: string;
  pros: string;
  risks: string;
  costs: string;
  nextSteps: string;
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
