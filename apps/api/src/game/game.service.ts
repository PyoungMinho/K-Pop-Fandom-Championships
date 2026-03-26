import { Injectable } from "@nestjs/common";

@Injectable()
export class GameService {
  private scores = new Map<string, number>();

  addClick(teamId: string): number {
    const current = this.scores.get(teamId) ?? 0;
    const next = current + 1;
    this.scores.set(teamId, next);
    return next;
  }

  getScore(teamId: string): number {
    return this.scores.get(teamId) ?? 0;
  }

  getAllScores(): Record<string, number> {
    return Object.fromEntries(this.scores);
  }
}
