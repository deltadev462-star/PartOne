import { useState, useEffect } from "react";
import { XIcon, UserIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../configs/api";
import { useTranslation } from "react-i18next";

const CreateRequirementDialog = ({ isDialogOpen, setIsDialogOpen, projectId, onSuccess, requirement = null }) => {
    const { getToken } = useAuth();
    const { t } = useTranslation();
    const { currentWorkspace } = useSelector((state) => state.workspace);
    
    // Find the current project from workspace
    const currentProject = currentWorkspace?.projects?.find(p => p.id === projectId);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "FUNCTIONAL",
        priority: "MEDIUM",
        status: "DRAFT",
        stakeholderIds: []
    });

    const [stakeholders, setStakeholders] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (requirement) {
            setFormData({
                title: requirement.title,
                description: requirement.description || "",
                type: requirement.type,
                priority: requirement.priority,
                status: requirement.status,
                stakeholderIds: requirement.stakeholders?.map(s => s.stakeholder.id) || []
            });
        }
    }, [requirement]);

    useEffect(() => {
        if (projectId && isDialogOpen) {
            fetchStakeholders();
        }
    }, [projectId, isDialogOpen]);

    const fetchStakeholders = async () => {
        try {
            const { data } = await api.get(`/api/stakeholders/project/${projectId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setStakeholders(data.stakeholders);
        } catch (error) {
            console.error("Failed to fetch stakeholders:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            
            const endpoint = requirement
                ? `/api/requirements/${requirement.id}`
                : "/api/requirements";
            
            const method = requirement ? "put" : "post";
            
            const payload = requirement
                ? formData
                : { ...formData, projectId };

            const { data } = await api[method](endpoint, payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            
            toast.success(requirement ? "Requirement updated successfully" : "Requirement created successfully");
            setIsDialogOpen(false);
            
            if (onSuccess) {
                onSuccess();
            }
            
            // Reset form if creating new
            if (!requirement) {
                setFormData({
                    title: "",
                    description: "",
                    type: "FUNCTIONAL",
                    priority: "MEDIUM",
                    status: "DRAFT",
                    stakeholderIds: []
                });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStakeholder = (stakeholderId) => {
        setFormData((prev) => ({
            ...prev,
            stakeholderIds: prev.stakeholderIds.includes(stakeholderId)
                ? prev.stakeholderIds.filter(id => id !== stakeholderId)
                : [...prev.stakeholderIds, stakeholderId]
        }));
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-200 relative">
                <button 
                    className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" 
                    onClick={() => setIsDialogOpen(false)}
                >
                    <XIcon className="size-5" />
                </button>

                <h2 className="text-xl font-medium mb-1">
                    {requirement ? t("requirements.dialog.editTitle") : t("requirements.dialog.createTitle")}
                </h2>
                {currentProject && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        {t("requirements.dialog.inProject")} <span className="text-blue-600 dark:text-blue-400">{currentProject.name}</span>
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm mb-1">{t("requirements.dialog.title")} *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t("requirements.dialog.titlePlaceholder")}
                            className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm mb-1">{t("requirements.dialog.description")}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("requirements.dialog.descriptionPlaceholder")}
                            className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-24 resize-none"
                        />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">{t("requirements.dialog.type")}</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            >
                                <option value="FUNCTIONAL">{t("requirements.types.functional")}</option>
                                <option value="NON_FUNCTIONAL">{t("requirements.types.nonFunctional")}</option>
                                <option value="BUSINESS">{t("requirements.types.business")}</option>
                                <option value="TECHNICAL">{t("requirements.types.technical")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">{t("requirements.dialog.priority")}</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            >
                                <option value="LOW">{t("project.priority.low")}</option>
                                <option value="MEDIUM">{t("project.priority.medium")}</option>
                                <option value="HIGH">{t("project.priority.high")}</option>
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm mb-1">{t("requirements.dialog.status")}</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                        >
                            <option value="DRAFT">{t("requirements.status.draft")}</option>
                            <option value="REVIEW">{t("requirements.status.review")}</option>
                            <option value="APPROVED">{t("requirements.status.approved")}</option>
                            <option value="IMPLEMENTED">{t("requirements.status.implemented")}</option>
                            <option value="VERIFIED">{t("requirements.status.verified")}</option>
                            <option value="CLOSED">{t("requirements.status.closed")}</option>
                        </select>
                    </div>

                    {/* Stakeholders */}
                    {stakeholders.length > 0 && (
                        <div>
                            <label className="block text-sm mb-2">{t("requirements.dialog.stakeholders")}</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border border-zinc-300 dark:border-zinc-700 rounded p-2">
                                {stakeholders.map((stakeholder) => (
                                    <label key={stakeholder.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.stakeholderIds.includes(stakeholder.id)}
                                            onChange={() => toggleStakeholder(stakeholder.id)}
                                            className="rounded border-zinc-300 dark:border-zinc-600"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <UserIcon className="w-4 h-4 text-zinc-500" />
                                            <div>
                                                <div className="text-sm font-medium">{stakeholder.name}</div>
                                                <div className="text-xs text-zinc-500">{stakeholder.role} - {stakeholder.department || 'No Department'}</div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {stakeholders.length === 0 && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{t("requirements.dialog.noStakeholders")}</p>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            {t("requirements.dialog.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.title.trim()}
                            className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:text-zinc-200 disabled:opacity-50"
                        >
                            {isSubmitting ? t("requirements.dialog.saving") : (requirement ? t("requirements.dialog.update") : t("requirements.dialog.create"))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRequirementDialog;