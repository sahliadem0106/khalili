/**
 * AudioService - Manage Adhan and other audio playback
 */

class AudioServiceClass {
    private adhanAudio: HTMLAudioElement | null = null;
    private isAdhanPlaying: boolean = false;
    private autoplayBlocked: boolean = false;

    /**
     * Play the Adhan audio
     * @returns Promise<boolean> - true if playback started successfully
     */
    async playAdhan(onEnded?: () => void): Promise<boolean> {
        try {
            // Stop any currently playing adhan first
            this.stopAdhan();

            // Create new audio instance
            this.adhanAudio = new Audio('/audio/adhan.mp3');
            this.adhanAudio.volume = 1.0;

            // Set up event listeners
            this.adhanAudio.onended = () => {
                this.isAdhanPlaying = false;
                if (onEnded) onEnded();
            };

            this.adhanAudio.onerror = (e) => {
                console.error('[AudioService] Adhan audio error:', e);
                this.isAdhanPlaying = false;
            };

            // Attempt to play
            await this.adhanAudio.play();
            this.isAdhanPlaying = true;
            this.autoplayBlocked = false;
            console.log('[AudioService] Adhan playback started');
            return true;
        } catch (error) {
            const playbackError = error as DOMException;
            this.autoplayBlocked = playbackError?.name === 'NotAllowedError';
            if (this.autoplayBlocked) {
                console.warn('[AudioService] Adhan blocked until user interaction');
            } else {
                console.error('[AudioService] Failed to play Adhan:', error);
            }
            this.isAdhanPlaying = false;
            return false;
        }
    }

    /**
     * Stop the Adhan audio with a fade out effect
     */
    stopAdhan(): void {
        if (this.adhanAudio) {
            // Fade out over 500ms
            const fadeOut = setInterval(() => {
                if (this.adhanAudio && this.adhanAudio.volume > 0.1) {
                    this.adhanAudio.volume -= 0.1;
                } else {
                    clearInterval(fadeOut);
                    if (this.adhanAudio) {
                        this.adhanAudio.pause();
                        this.adhanAudio.currentTime = 0;
                        this.adhanAudio = null;
                    }
                    this.isAdhanPlaying = false;
                    console.log('[AudioService] Adhan stopped');
                }
            }, 50);
        }
    }

    /**
     * Check if Adhan is currently playing
     */
    isPlaying(): boolean {
        return this.isAdhanPlaying;
    }

    isAutoplayBlocked(): boolean {
        return this.autoplayBlocked;
    }

    /**
     * Preload the Adhan audio for faster playback
     */
    preloadAdhan(): void {
        const tempAudio = new Audio('/audio/adhan.mp3');
        tempAudio.preload = 'auto';
        tempAudio.load();
    }
}

// Export singleton instance
export const audioService = new AudioServiceClass();
