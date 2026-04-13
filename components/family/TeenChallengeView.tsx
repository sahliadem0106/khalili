
import React from 'react';
import { Challenge } from '../../types/partner';
import { CheckCircle2, Clock, Award, Circle } from 'lucide-react';
import { FamilyService } from '../../services/FamilyService';
import { useAuth } from '../../hooks/useAuth';

interface TeenChallengeViewProps {
    challenges: Challenge[];
    onRefresh: () => void;
}

export const TeenChallengeView: React.FC<TeenChallengeViewProps> = ({ challenges, onRefresh }) => {
    const { user } = useAuth();

    const handleComplete = async (challengeId: string) => {
        if (!user) return;
        const note = prompt("Optional: Add a note about your completion:");
        if (note !== null) {
            await FamilyService.submitProof(challengeId, user.uid, note);
            onRefresh();
        }
    };

    if (challenges.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-emerald-900 text-lg px-1">Active Challenges</h3>
            <div className="grid gap-3">
                {challenges.map(challenge => {
                    const myStatus = user ? challenge.participantsStatus[user.uid] : undefined;
                    const isCompleted = myStatus === 'submitted' || myStatus === 'approved';
                    const deadline = new Date(challenge.deadline.seconds * 1000);
                    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 3600 * 24));

                    return (
                        <div key={challenge.id} className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm flex gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900">{challenge.title}</h4>
                                    {challenge.reward && (
                                        <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center border border-amber-100 font-medium">
                                            <Award size={12} className="mr-1" /> {challenge.reward}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className={`flex items-center ${daysLeft < 2 ? 'text-red-500 font-bold' : ''}`}>
                                        <Clock size={12} className="mr-1" /> {daysLeft} days left
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center border-l border-gray-100 pl-4">
                                <button
                                    onClick={() => !isCompleted && handleComplete(challenge.id)}
                                    disabled={isCompleted}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 border-2 border-gray-200 hover:border-emerald-200'
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <span className="text-[10px] text-center mt-1 text-gray-400 font-medium">
                                    {isCompleted ? 'Done' : 'Mark'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
