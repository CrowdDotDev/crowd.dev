export interface Session {
  id?: string;
  userId: string;
  userEmail: string;
  startTime: string;
  endTime?: string;
}
