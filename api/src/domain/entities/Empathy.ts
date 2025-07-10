export type EmpathyType = 'helpful' | 'interested' | 'supportive'

export class Empathy {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly postId: string,
    public readonly empathyType: EmpathyType,
    public readonly createdAt: Date
  ) {}
}
