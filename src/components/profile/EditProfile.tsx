import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, MapPin, User as UserIcon, Save, Calendar, FileText, Heart, X, Plus, Share2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { onboardingService } from '../../services/OnboardingService';
import { useToast, Toast } from '../shared/Toast';
import { AnimatePresence } from 'framer-motion';

interface EditProfileProps {
    user: User;
    onUpdate: (user: User) => void;
    onBack: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onUpdate, onBack }) => {
    const { language, t } = useLanguage();
    const { user: firebaseUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [name, setName] = useState(user.name);
    const [nickname, setNickname] = useState('');
    const [location, setLocation] = useState(user.location);
    const [age, setAge] = useState<number | ''>('');
    const [about, setAbout] = useState('');
    const [hobbies, setHobbies] = useState<string[]>([]);
    const [newHobby, setNewHobby] = useState('');
    const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; handle: string }>>([]);
    const [socialInput, setSocialInput] = useState({ platform: 'WhatsApp', handle: '' });
    const [gender, setGender] = useState<'male' | 'female' | null>(onboardingService.getGender() || user.gender || null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast, showToast, clearToast } = useToast();

    // Load existing profile data from Firestore
    useEffect(() => {
        const loadProfile = async () => {
            if (!firebaseUser?.uid) {
                setLoading(false);
                return;
            }
            try {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFirstName(data.firstName || '');
                    setLastName(data.lastName || '');
                    setName(data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || '');
                    setNickname(data.nickname || '');
                    setLocation(data.location || data.city || '');
                    setAge(data.age || '');
                    setAbout(data.bio || data.about || '');
                    setHobbies(data.hobbies || []);
                    setSocialLinks(data.socialLinks || []);
                    if (data.gender) setGender(data.gender);
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [firebaseUser?.uid]);

    const handleAddHobby = () => {
        if (newHobby.trim() && hobbies.length < 5) {
            setHobbies([...hobbies, newHobby.trim()]);
            setNewHobby('');
        }
    };

    const handleRemoveHobby = (index: number) => {
        setHobbies(hobbies.filter((_, i) => i !== index));
    };

    const handleAddSocialLink = () => {
        if (socialInput.handle.trim() && socialLinks.length < 3) {
            setSocialLinks([...socialLinks, { platform: socialInput.platform, handle: socialInput.handle.trim() }]);
            setSocialInput({ platform: 'WhatsApp', handle: '' });
        }
    };

    const handleRemoveSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fullName = `${firstName} ${lastName}`.trim();

            // Update Firestore
            if (firebaseUser?.uid) {
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                    firstName,
                    lastName,
                    displayName: fullName || name,
                    nickname,
                    age: age || null,
                    bio: about,
                    about,
                    hobbies,
                    location,
                    socialLinks,
                    photoURL: gender === 'female' ? '/womenicon.png' : '/manicon.png',
                    updatedAt: new Date().toISOString()
                });
            }

            // Update local state
            // Update local state
            onUpdate({
                ...user,
                name: fullName || name,
                location,
                avatar: gender === 'female' ? '/womenicon.png' : '/manicon.png'
            });
            onBack();
        } catch (error) {
            console.error('Failed to save profile:', error);
            showToast('Failed to save profile. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-brand-surface dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b border-brand-primary/10 dark:border-gray-700">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-colors"
                >
                    <ArrowLeft size={24} className="text-brand-primary" />
                </button>
                <h2 className="text-xl font-bold text-brand-forest dark:text-white">
                    {t('profile_edit')}
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 text-brand-primary font-semibold hover:bg-brand-primary/5 rounded-full disabled:opacity-50"
                >
                    {saving ? <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" /> : <Save size={24} />}
                </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <img
                            src={gender === 'female' ? '/womenicon.png' : '/manicon.png'}
                            alt="Profile"
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl bg-white"
                        />
                    </div>

                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                                {t('profile_first_name')}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full p-4 pl-12 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-brand-forest placeholder:text-brand-muted"
                                    placeholder={t('profile_first_name_ph')}
                                />
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                                {t('profile_last_name')}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-4 pl-12 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-brand-forest placeholder:text-brand-muted"
                                    placeholder={t('profile_last_name_ph')}
                                />
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Nickname */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_nickname')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full p-4 pl-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-gray-900 dark:text-white"
                                placeholder={t('profile_nickname_ph')}
                            />
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                        </div>
                    </div>

                    {/* Age */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_age')}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full p-4 pl-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-gray-900 dark:text-white"
                                placeholder={t('profile_age_ph')}
                                min={13}
                                max={120}
                            />
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_location')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full p-4 pl-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-gray-900 dark:text-white"
                                placeholder={t('profile_location_ph')}
                            />
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                        </div>
                    </div>

                    {/* About */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_about_me')}
                        </label>
                        <div className="relative">
                            <textarea
                                value={about}
                                onChange={(e) => setAbout(e.target.value.slice(0, 200))}
                                className="w-full p-4 pl-12 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none text-brand-forest placeholder:text-brand-muted"
                                placeholder={t('profile_about_ph')}
                                rows={3}
                            />
                            <FileText className="absolute left-4 top-4 text-brand-muted" size={20} />
                        </div>
                        <p className="text-xs text-brand-muted text-right">{about.length}/200</p>
                    </div>

                    {/* Hobbies */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_hobbies')} ({hobbies.length}/5)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {hobbies.map((hobby, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-sm"
                                >
                                    {hobby}
                                    <button
                                        onClick={() => handleRemoveHobby(index)}
                                        className="ml-1 hover:bg-brand-primary/20 rounded-full p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        {hobbies.length < 5 && (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={newHobby}
                                        onChange={(e) => setNewHobby(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
                                        className="w-full p-4 pl-12 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-brand-forest placeholder:text-brand-muted"
                                        placeholder={t('profile_hobbies_ph')}
                                    />
                                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                                </div>
                                <button
                                    onClick={handleAddHobby}
                                    disabled={!newHobby.trim()}
                                    className="px-4 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Social Media Links */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-forest/70 dark:text-gray-300 px-1">
                            {t('profile_social_media')} ({socialLinks.length}/3)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {socialLinks.map((link, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-secondary/10 text-brand-secondary rounded-full text-sm"
                                >
                                    <span className="font-medium">{link.platform}:</span> {link.handle}
                                    <button
                                        onClick={() => handleRemoveSocialLink(index)}
                                        className="ml-1 hover:bg-brand-secondary/20 rounded-full p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        {socialLinks.length < 3 && (
                            <div className="flex gap-2">
                                <select
                                    value={socialInput.platform}
                                    onChange={(e) => setSocialInput({ ...socialInput, platform: e.target.value })}
                                    className="p-4 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-brand-forest"
                                >
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Telegram">Telegram</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="X">X (Twitter)</option>
                                    <option value="Other">{t('profile_social_other')}</option>
                                </select>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={socialInput.handle}
                                        onChange={(e) => setSocialInput({ ...socialInput, handle: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSocialLink()}
                                        className="w-full p-4 pl-12 rounded-xl bg-brand-subtle border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-brand-forest placeholder:text-brand-muted"
                                        placeholder={t('profile_social_ph')}
                                    />
                                    <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
                                </div>
                                <button
                                    onClick={handleAddSocialLink}
                                    disabled={!socialInput.handle.trim()}
                                    className="px-4 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {toast && <Toast {...toast} onDismiss={clearToast} />}
            </AnimatePresence>
        </div>
    );
};
