import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Archive, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { updateProjects } from "../features/workspaceSlice";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";
import toast from "react-hot-toast";

const statusColors = {
    PLANNING: "bg-gray-200 dark:bg-zinc-600 text-gray-900 dark:text-zinc-200",
    ACTIVE: "bg-emerald-200 dark:bg-emerald-500 text-emerald-900 dark:text-emerald-900",
    ON_HOLD: "bg-amber-200 dark:bg-amber-500 text-amber-900 dark:text-amber-900",
    COMPLETED: "bg-blue-200 dark:bg-blue-500 text-blue-900 dark:text-blue-900",
    CANCELLED: "bg-red-200 dark:bg-red-500 text-red-900 dark:text-red-900",
};

const ProjectCard = ({ project, showArchived }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleArchiveToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLoading(true);
        
        try {
            const endpoint = project.archived ? 'restore' : 'archive';
            const token = await getToken();
            const response = await api.patch(
                `/api/projects/${project.id}/${endpoint}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data.project) {
                // Update the project in the store
                dispatch(updateProjects(response.data.project));
                const message = project.archived
                    ? t("projects.projectRestored")
                    : t("projects.projectArchived");
                toast.success(message || (project.archived ? "Project restored" : "Project archived"));
            }
        } catch (error) {
            console.error('Error toggling archive status:', error);
            toast.error(error.response?.data?.message || "Failed to update project");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-lg p-5 transition-all duration-200 group">
            <Link to={`/projectsDetail?id=${project.id}&tab=tasks`} className="block">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-zinc-200 mb-1 truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm line-clamp-2 mb-3">
                            {project.description || t("projectCard.noDescription")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[project.status]}`} >
                            {t(`project.status.${project.status.toLowerCase()}`)}
                        </span>
                        {project.archived && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-500 text-white">
                                {t("projects.archived")}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-zinc-500 capitalize">
                        {t(`project.priority.${project.priority.toLowerCase()}`)} {t("projectCard.priority")}
                    </span>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-zinc-500">{t("projectCard.progress")}</span>
                        <span className="text-gray-400 dark:text-zinc-400">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded">
                        <div className="h-1.5 rounded bg-blue-500" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                </div>
            </Link>
            
            {/* Archive/Restore Button */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-zinc-700">
                <button
                    onClick={handleArchiveToggle}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        project.archived
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-[#111111]   dark:hover:bg-[#090909] dark:text-white text-black'
                    }`}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {t("common.loading")}
                        </span>
                    ) : project.archived ? (
                        <>
                            <ArchiveRestore className="w-4 h-4" />
                            {t("projects.restore")}
                        </>
                    ) : (
                        <>
                            <Archive className="w-4 h-4" />
                            {t("projects.archive")}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProjectCard;
