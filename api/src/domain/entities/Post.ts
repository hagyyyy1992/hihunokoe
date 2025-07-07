export class Post {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly productName: string | null,
    public readonly brandName: string | null,
    public readonly imageUrl: string | null,
    public readonly category: string | null,
    public readonly isPublished: boolean,
    public readonly publishedAt: Date | null, // Added for compatibility
    public readonly status: string, // Added for database compatibility
    public readonly cosmeticName: string, // Alias for productName
    public readonly cosmeticCategory: string | null, // Alias for category
    public readonly skinType: string | null,
    public readonly moodTag: string | null,
    public readonly viewCount: number,
    public readonly empathyCount: number,
    public readonly commentCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  get isValid(): boolean {
    return this.title.trim().length > 0 && this.content.trim().length > 0
  }

  get excerpt(): string {
    return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content
  }
}
