/**
 * Generates a visual progress bar.
 * @param current Current progress value
 * @param total Total value
 * @param length Length of the progress bar in characters
 * @returns A string representing the progress bar
 */
export function createProgressBar(current: number, total: number, length: number = 20): string {
    const progress = Math.min(Math.max(current / total, 0), 1);
    const filledLength = Math.round(length * progress);
    const emptyLength = length - filledLength;
    
    // Using blocks for filled part and dashes for empty part
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(emptyLength);
    
    const percentage = Math.round(progress * 100);
    return `[${filledBar}${emptyBar}] ${percentage}%`;
}
