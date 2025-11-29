import { useState } from "react";
import { XIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { addProject } from "../features/workspaceSlice";
import toast from "react-hot-toast";
import api from "../configs/api";
 
import { useTranslation } from "react-i18next";
 
import { useNavigate } from "react-router-dom";
 
const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {

    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { currentWorkspace } = useSelector((state) => state.workspace);
 
    const { t } = useTranslation();
 
    const navigate = useNavigate();
 
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        team_members: [],
        team_lead: "",
        progress: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.team_lead) {
                return toast.error(t("createProject.selectTeamLead"));
            }
            setIsSubmitting(true);
            const { data } = await api.post("/api/projects", { workspaceId: currentWorkspace.id, ...formData }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            dispatch(addProject(data.project));
            setIsDialogOpen(false);
        } catch (error) {
            const errorData = error?.response?.data;
            
            // Check if the error is due to plan limit exceeded
            if (errorData?.error === 'PLAN_LIMIT_EXCEEDED') {
                toast.error(`You've reached your project limit (${errorData.limit} projects). Please upgrade your plan to create more projects.`);
                setIsDialogOpen(false);
                navigate('/pricing');
            } else {
                toast.error(errorData?.message || error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeTeamMember = (email) => {
        setFormData((prev) => ({ ...prev, team_members: prev.team_members.filter(m => m !== email) }));
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative">
                <button className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" onClick={() => setIsDialogOpen(false)} >
                    <XIcon className="size-5" />
                </button>

                <h2 className="text-xl font-medium mb-1">{t("createProject.title")}</h2>
                {currentWorkspace && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        {t("createProject.inWorkspace")} <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm mb-1">{t("createProject.projectName")}</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t("createProject.namePlaceholder")} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" required />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm mb-1">{t("createProject.description")}</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t("createProject.descriptionPlaceholder")} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-20" />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">{t("createProject.status")}</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" >
                                <option value="PLANNING">{t("project.status.planning")}</option>
                                <option value="ACTIVE">{t("project.status.active")}</option>
                                <option value="COMPLETED">{t("project.status.completed")}</option>
                                <option value="ON_HOLD">{t("project.status.onHold")}</option>
                                <option value="CANCELLED">{t("project.status.cancelled")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">{t("createProject.priority")}</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" >
                                <option value="LOW">{t("project.priority.low")}</option>
                                <option value="MEDIUM">{t("project.priority.medium")}</option>
                                <option value="HIGH">{t("project.priority.high")}</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">{t("createProject.startDate")}</label>
                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">{t("createProject.endDate")}</label>
                            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} min={formData.start_date && new Date(formData.start_date).toISOString().split('T')[0]} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" />
                        </div>
                    </div>

                    {/* Lead */}
                    <div>
                        <label className="block text-sm mb-1">{t("createProject.projectLead")}</label>
                        <select value={formData.team_lead} onChange={(e) => setFormData({ ...formData, team_lead: e.target.value, team_members: e.target.value ? [...new Set([...formData.team_members, e.target.value])] : formData.team_members, })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm" >
                            <option value="">{t("createProject.noLead")}</option>
                            {currentWorkspace?.members?.map((member) => (
                                <option key={member.user.email} value={member.user.email}>
                                    {member.user.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Team Members */}
                    <div>
                        <label className="block text-sm mb-1">{t("createProject.teamMembers")}</label>
                        <select className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            onChange={(e) => {
                                if (e.target.value && !formData.team_members.includes(e.target.value)) {
                                    setFormData((prev) => ({ ...prev, team_members: [...prev.team_members, e.target.value] }));
                                }
                            }}
                        >
                            <option value="">{t("createProject.addTeamMembers")}</option>
                            {currentWorkspace?.members
                                ?.filter((email) => !formData.team_members.includes(email))
                                .map((member) => (
                                    <option key={member.user.email} value={member.email}>
                                        {member.user.email}
                                    </option>
                                ))}
                        </select>

                        {formData.team_members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.team_members.map((email) => (
                                    <div key={email} className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm" >
                                        {email}
                                        <button type="button" onClick={() => removeTeamMember(email)} className="ml-1 hover:bg-blue-300/30 dark:hover:bg-blue-500/30 rounded" >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800" >
                            {t("common.cancel")}
                        </button>
                        <button disabled={isSubmitting || !currentWorkspace} className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:text-zinc-200" >
                            {isSubmitting ? t("createProject.creating") : t("createProject.title")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;