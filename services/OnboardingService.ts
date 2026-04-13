/**
 * OnboardingService - Track onboarding completion status
 */

export interface OnboardingData {
    completed: boolean;
    isGoogleLinked?: boolean;
    gender?: 'male' | 'female';
    completedAt?: string;
    profile?: {
        firstName: string;
        lastName: string;
        nickname: string;
        age: number;
        hobbies: string[];
        bio: string;
        location: {
            city: string;
            country: string;
        };
        socialLinks?: Array<{ platform: string; handle: string }>;
    };
}

const ONBOARDING_KEY = 'khalil_onboarding';

class OnboardingService {
    getOnboardingData(): OnboardingData | null {
        try {
            const data = localStorage.getItem(ONBOARDING_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    isOnboardingComplete(): boolean {
        const data = this.getOnboardingData();
        return data?.completed === true;
    }

    getGender(): 'male' | 'female' | null {
        const data = this.getOnboardingData();
        return data?.gender || null;
    }

    /**
     * Check if profile has all required fields filled
     * Required: gender, firstName, lastName, nickname, age, location (city), at least 1 social link
     * Optional: hobbies, bio
     */
    isProfileComplete(): boolean {
        const data = this.getOnboardingData();
        if (!data) return false;

        const hasGender = !!data.gender;
        const hasFirstName = !!data.profile?.firstName?.trim();
        const hasLastName = !!data.profile?.lastName?.trim();
        const hasNickname = !!data.profile?.nickname?.trim();
        const hasAge = !!(data.profile?.age && data.profile.age > 0);
        const hasLocation = !!data.profile?.location?.city?.trim();
        const hasSocialLinks = !!(data.profile?.socialLinks && data.profile.socialLinks.length > 0);

        return hasGender && hasFirstName && hasLastName && hasNickname && hasAge && hasLocation && hasSocialLinks;
    }

    saveGender(gender: 'male' | 'female'): void {
        const existing = this.getOnboardingData() || { completed: false };
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            ...existing,
            gender,
        }));
    }

    saveProfile(profile: OnboardingData['profile']): void {
        const existing = this.getOnboardingData() || { completed: false };
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            ...existing,
            profile,
        }));
    }

    completeOnboarding(): void {
        const existing = this.getOnboardingData() || {};
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            ...existing,
            completed: true,
            completedAt: new Date().toISOString(),
        }));
    }

    markGoogleLinked(): void {
        const existing = this.getOnboardingData() || { completed: false };
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            ...existing,
            isGoogleLinked: true,
        }));
    }

    isGoogleLinked(): boolean {
        return this.getOnboardingData()?.isGoogleLinked === true;
    }

    resetOnboarding(): void {
        localStorage.removeItem(ONBOARDING_KEY);
    }

    resetProfileCompletion(): void {
        const existing = this.getOnboardingData() || {};
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            ...existing,
            completed: false,
            gender: undefined,
            profile: undefined
        }));
    }
}

export const onboardingService = new OnboardingService();
