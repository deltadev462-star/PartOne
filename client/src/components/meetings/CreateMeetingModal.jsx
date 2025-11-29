import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Link,
    Users,
    FileText,
    Plus,
    Trash,
    RefreshCw,
    Video,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateMeetingModal = ({
    isOpen,
    onClose,
    onCreate,
    projectId,
    projects,
    isDark,
    selectedDate
}) => {
    const { t } = useTranslation();
    const { userId } = useAuth();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        agenda: '',
        projectId: projectId || '',
        meetingType: 'ONE_TIME',
        meetingDate: '',
        endDate: '',
        duration: 60,
        location: '',
        meetingLink: '',
        recurrencePattern: '',
        recurrenceEndDate: '',
        participants: [],
        distributionList: []
    });

    const [newParticipant, setNewParticipant] = useState({
        name: '',
        email: '',
        role: 'ATTENDEE'
    });

    const [newEmail, setNewEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (projectId) {
            setFormData(prev => ({ ...prev, projectId }));
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedDate && isOpen) {
            // Set the meeting date to the selected date at 9 AM
            const dateTime = new Date(selectedDate);
            dateTime.setHours(9, 0, 0, 0);
            const dateTimeString = dateTime.toISOString().slice(0, 16); // Format for datetime-local input
            setFormData(prev => ({ ...prev, meetingDate: dateTimeString }));
        }
    }, [selectedDate, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddParticipant = () => {
        if (!newParticipant.name || !newParticipant.email) {
            toast.error(t('meetings.errors.participantRequired'));
            return;
        }

        if (!validateEmail(newParticipant.email)) {
            toast.error(t('meetings.errors.invalidEmail'));
            return;
        }

        setFormData(prev => ({
            ...prev,
            participants: [...prev.participants, { ...newParticipant, id: Date.now() }]
        }));

        setNewParticipant({ name: '', email: '', role: 'ATTENDEE' });
    };

    const handleRemoveParticipant = (index) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter((_, i) => i !== index)
        }));
    };

    const handleAddEmail = () => {
        if (!newEmail) return;

        if (!validateEmail(newEmail)) {
            toast.error(t('meetings.errors.invalidEmail'));
            return;
        }

        if (formData.distributionList.includes(newEmail)) {
            toast.error(t('meetings.errors.emailExists'));
            return;
        }

        setFormData(prev => ({
            ...prev,
            distributionList: [...prev.distributionList, newEmail]
        }));
        setNewEmail('');
    };

    const handleRemoveEmail = (email) => {
        setFormData(prev => ({
            ...prev,
            distributionList: prev.distributionList.filter(e => e !== email)
        }));
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = t('meetings.errors.titleRequired');
        }

        if (!formData.meetingDate) {
            newErrors.meetingDate = t('meetings.errors.dateRequired');
        }

        if (formData.meetingType === 'RECURRING') {
            if (!formData.recurrencePattern) {
                newErrors.recurrencePattern = t('meetings.errors.recurrenceRequired');
            }
            if (!formData.recurrenceEndDate) {
                newErrors.recurrenceEndDate = t('meetings.errors.recurrenceEndRequired');
            }
        }

        if (formData.endDate && new Date(formData.endDate) <= new Date(formData.meetingDate)) {
            newErrors.endDate = t('meetings.errors.invalidEndDate');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error(t('validation.required'));
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreate(formData);
            onClose();
        } catch (error) {
            console.error('Error creating meeting:', error);
            toast.error(t('meetings.notifications.createError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center backdrop-blur-xl justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
               

                <div className={`inline-block align-bottom z-50 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full
                    dark:bg-[#101010] bg-white`}>
                    
                    {/* Header */}
                    <div className={`px-6 py-4 bo `}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {t('meetings.createNew', 'Schedule New Meeting')}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {/* Basic Information */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('meetings.form.basicInformation')}
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.meetingTitle')} *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg  
                                                dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900
                                                ${errors.title ? 'border-red-500' : ''}`}
                                            placeholder={t('meetings.placeholders.enterTitle')}
                                        />
                                        {errors.title && (
                                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.project')}
                                        </label>
                                        <select
                                            name="projectId"
                                            value={formData.projectId}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                        >
                                            <option value="">{t('meetings.form.globalMeeting')}</option>
                                            {projects?.map(project => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.description')}
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.briefDescription')}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.agenda')}
                                        </label>
                                        <textarea
                                            name="agenda"
                                            value={formData.agenda}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.meetingAgenda')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t('meetings.form.schedule')}
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.meetingType')}
                                        </label>
                                        <select
                                            name="meetingType"
                                            value={formData.meetingType}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                        >
                                            <option value="ONE_TIME">{t('meetings.form.oneTime')}</option>
                                            <option value="RECURRING">{t('meetings.type.recurring')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.startDateTime')} *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="meetingDate"
                                            value={formData.meetingDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900
                                                ${errors.meetingDate ? 'border-red-500' : ''}`}
                                        />
                                        {errors.meetingDate && (
                                            <p className="text-red-500 text-xs mt-1">{errors.meetingDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.endDateTime')}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900
                                                ${errors.endDate ? 'border-red-500' : ''}`}
                                        />
                                        {errors.endDate && (
                                            <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.duration')}
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleInputChange}
                                            min="15"
                                            step="15"
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                        />
                                    </div>

                                    {formData.meetingType === 'RECURRING' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    {t('meetings.form.recurrencePattern')} *
                                                </label>
                                                <select
                                                    name="recurrencePattern"
                                                    value={formData.recurrencePattern}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900
                                                        ${errors.recurrencePattern ? 'border-red-500' : ''}`}
                                                >
                                                    <option value="">{t('meetings.form.selectPattern')}</option>
                                                    <option value="DAILY">{t('meetings.recurrence.daily')}</option>
                                                    <option value="WEEKLY">{t('meetings.recurrence.weekly')}</option>
                                                    <option value="BIWEEKLY">{t('meetings.recurrence.biweekly')}</option>
                                                    <option value="MONTHLY">{t('meetings.recurrence.monthly')}</option>
                                                    <option value="QUARTERLY">{t('meetings.recurrence.quarterly')}</option>
                                                </select>
                                                {errors.recurrencePattern && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.recurrencePattern}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    {t('meetings.form.recurrenceEndDate')} *
                                                </label>
                                                <input
                                                    type="date"
                                                    name="recurrenceEndDate"
                                                    value={formData.recurrenceEndDate}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900
                                                        ${errors.recurrenceEndDate ? 'border-red-500' : ''}`}
                                                />
                                                {errors.recurrenceEndDate && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.recurrenceEndDate}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {t('meetings.form.location')}
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.physicalLocation')}
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.meetingRoom')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t('meetings.form.meetingLink')}
                                        </label>
                                        <input
                                            type="url"
                                            name="meetingLink"
                                            value={formData.meetingLink}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.meetingUrl')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {t('meetings.form.participants')}
                                </h4>
                                
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            value={newParticipant.name}
                                            onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
                                            className={`px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.participantName')}
                                        />
                                        <input
                                            type="email"
                                            value={newParticipant.email}
                                            onChange={(e) => setNewParticipant({...newParticipant, email: e.target.value})}
                                            className={`px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.participantEmail')}
                                        />
                                        <select
                                            value={newParticipant.role}
                                            onChange={(e) => setNewParticipant({...newParticipant, role: e.target.value})}
                                            className={`px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                        >
                                            <option value="ORGANIZER">{t('meetings.form.organizer')}</option>
                                            <option value="PRESENTER">{t('meetings.form.presenter')}</option>
                                            <option value="ATTENDEE">{t('meetings.form.attendee')}</option>
                                            <option value="OPTIONAL">{t('meetings.form.optional')}</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleAddParticipant}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {t('meetings.form.add')}
                                        </button>
                                    </div>
                                </div>

                                {formData.participants.length > 0 && (
                                    <div className={`border rounded-lg p-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                        {formData.participants.map((participant, index) => (
                                            <div key={participant.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{participant.name}</span>
                                                    <span className="text-sm text-gray-500">{participant.email}</span>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        participant.role === 'ORGANIZER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        participant.role === 'PRESENTER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        participant.role === 'OPTIONAL' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' :
                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                        {participant.role}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveParticipant(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Distribution List */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {t('meetings.form.distributionList')}
                                </h4>
                                
                                <div className="mb-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                                            className={`flex-1 px-3 py-2 border rounded-lg dark:bg-[#101010] bg-white dark:border-gray-600 border-gray-300 dark:text-white text-gray-900`}
                                            placeholder={t('meetings.placeholders.addEmailToDistribution')}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddEmail}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {t('meetings.form.add')}
                                        </button>
                                    </div>
                                </div>

                                {formData.distributionList.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.distributionList.map(email => (
                                            <span
                                                key={email}
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                                                    ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmail(email)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-4   flex justify-end gap-3`}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t('meetings.form.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        {t('meetings.form.creating')}
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="h-4 w-4" />
                                        {t('meetings.form.scheduleMeeting')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateMeetingModal;