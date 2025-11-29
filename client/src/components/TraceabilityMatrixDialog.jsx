import { useState, useEffect } from "react";
import { XIcon, Download, Filter, Link2, UserIcon, CalendarIcon, CheckSquare } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { useTranslation } from "react-i18next";

const TraceabilityMatrixDialog = ({ isOpen, setIsOpen, projectId }) => {
    const { getToken } = useAuth();
    const { t } = useTranslation();
    
    const [matrixData, setMatrixData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        showStakeholders: true,
        showTasks: true,
        showMeetings: true,
        requirementType: "ALL",
        requirementStatus: "ALL"
    });

    useEffect(() => {
        if (isOpen && projectId) {
            fetchTraceabilityMatrix();
        }
    }, [isOpen, projectId]);

    const fetchTraceabilityMatrix = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/requirements/project/${projectId}/traceability-matrix`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setMatrixData(data);
        } catch (error) {
            toast.error("Failed to fetch traceability matrix");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const exportMatrix = () => {
        if (!matrixData) return;

        let csv = ["Requirement ID,Title,Type,Status,Priority,Owner,Stakeholders,Tasks,Meetings"];
        
        matrixData.matrix.forEach(req => {
            const stakeholders = req.stakeholders.map(s => `${s.name}(${s.role})`).join("; ");
            const tasks = req.tasks.map(t => `${t.title}(${t.status})`).join("; ");
            const meetings = req.meetings.map(m => `${m.title}(${new Date(m.date).toLocaleDateString()})`).join("; ");
            
            csv.push([
                req.id.substring(0, 8),
                req.title,
                req.type,
                req.status,
                req.priority,
                req.owner,
                stakeholders || "None",
                tasks || "None",
                meetings || "None"
            ].map(field => `"${field}"`).join(","));
        });

        const blob = new Blob([csv.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `traceability-matrix-${matrixData.project.name}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredMatrix = matrixData?.matrix.filter(req => {
        if (filters.requirementType !== "ALL" && req.type !== filters.requirementType) return false;
        if (filters.requirementStatus !== "ALL" && req.status !== filters.requirementStatus) return false;
        return true;
    });

    const statusColors = {
        DRAFT: "bg-gray-100 text-gray-800",
        REVIEW: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-green-100 text-green-800",
        IMPLEMENTED: "bg-blue-100 text-blue-800",
        VERIFIED: "bg-purple-100 text-purple-800",
        CLOSED: "bg-zinc-100 text-zinc-800"
    };

    const priorityColors = {
        HIGH: "text-red-600",
        MEDIUM: "text-yellow-600",
        LOW: "text-green-600"
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-medium text-zinc-900 dark:text-white">
                                {t("requirements.matrix.title")}
                            </h2>
                            {matrixData?.project && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {t("requirements.matrix.project")}: <span className="text-blue-600 dark:text-blue-400">{matrixData.project.name}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={exportMatrix}
                                className="flex items-center px-4 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            >
                                <Download className="size-4 mr-2" /> {t("requirements.matrix.exportCSV")}
                            </button>
                            <button 
                                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" 
                                onClick={() => setIsOpen(false)}
                            >
                                <XIcon className="size-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-sm">
                            <Filter className="size-4 text-zinc-500" />
                            <span className="text-zinc-700 dark:text-zinc-300">{t("requirements.matrix.filters.show")}</span>
                        </div>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.showStakeholders}
                                onChange={(e) => setFilters({...filters, showStakeholders: e.target.checked})}
                                className="rounded"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300">{t("requirements.matrix.filters.stakeholders")}</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.showTasks}
                                onChange={(e) => setFilters({...filters, showTasks: e.target.checked})}
                                className="rounded"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300">{t("requirements.matrix.filters.tasks")}</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.showMeetings}
                                onChange={(e) => setFilters({...filters, showMeetings: e.target.checked})}
                                className="rounded"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300">{t("requirements.matrix.filters.meetings")}</span>
                        </label>
                        
                        <div className="flex gap-2 ml-auto">
                            <select 
                                value={filters.requirementType}
                                onChange={(e) => setFilters({...filters, requirementType: e.target.value})}
                                className="px-3 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                <option value="ALL">{t("requirements.matrix.filters.allTypes")}</option>
                                <option value="FUNCTIONAL">{t("requirements.types.functional")}</option>
                                <option value="NON_FUNCTIONAL">{t("requirements.types.nonFunctional")}</option>
                                <option value="BUSINESS">{t("requirements.types.business")}</option>
                                <option value="TECHNICAL">{t("requirements.types.technical")}</option>
                            </select>
                            
                            <select
                                value={filters.requirementStatus}
                                onChange={(e) => setFilters({...filters, requirementStatus: e.target.value})}
                                className="px-3 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                <option value="ALL">{t("requirements.matrix.filters.allStatus")}</option>
                                <option value="DRAFT">{t("requirements.status.draft")}</option>
                                <option value="REVIEW">{t("requirements.status.review")}</option>
                                <option value="APPROVED">{t("requirements.status.approved")}</option>
                                <option value="IMPLEMENTED">{t("requirements.status.implemented")}</option>
                                <option value="VERIFIED">{t("requirements.status.verified")}</option>
                                <option value="CLOSED">{t("requirements.status.closed")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Matrix Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-500 dark:text-zinc-400">{t("requirements.matrix.loading")}</p>
                        </div>
                    ) : filteredMatrix?.length === 0 ? (
                        <div className="text-center py-12">
                            <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                            <p className="text-gray-500 dark:text-zinc-400">{t("requirements.matrix.noData")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredMatrix?.map((requirement) => (
                                <div key={requirement.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                                                    {requirement.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        ID: {requirement.id.substring(0, 8)}...
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded ${statusColors[requirement.status]}`}>
                                                        {t(`requirements.status.${requirement.status.toLowerCase()}`)}
                                                    </span>
                                                    <span className={`font-medium ${priorityColors[requirement.priority]}`}>
                                                        {t(`project.priority.${requirement.priority.toLowerCase()}`)}
                                                    </span>
                                                    <span className="text-zinc-500 dark:text-zinc-400">
                                                        {t("requirements.details.owner")}: {requirement.owner}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Stakeholders */}
                                        {filters.showStakeholders && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                                    <UserIcon className="size-4" /> {t("requirements.details.stakeholders")} ({requirement.stakeholders.length})
                                                </h4>
                                                {requirement.stakeholders.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {requirement.stakeholders.map((stakeholder, idx) => (
                                                            <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                                • {stakeholder.name} <span className="text-xs text-zinc-500">({stakeholder.role})</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-zinc-400 italic">{t("requirements.matrix.noLinked", { item: t("requirements.matrix.filters.stakeholders").toLowerCase() })}</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Tasks */}
                                        {filters.showTasks && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                                    <CheckSquare className="size-4" /> {t("requirements.table.tasks")} ({requirement.tasks.length})
                                                </h4>
                                                {requirement.tasks.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {requirement.tasks.map((task) => (
                                                            <li key={task.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                                • {task.title}
                                                                <span className={`text-xs ml-1 ${
                                                                    task.status === 'DONE' ? 'text-green-600' :
                                                                    task.status === 'IN_PROGRESS' ? 'text-yellow-600' : 'text-gray-600'
                                                                }`}>
                                                                    ({t(`task.status.${task.status.toLowerCase().replace("_", "")}`)})
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-zinc-400 italic">{t("requirements.matrix.noLinked", { item: t("requirements.matrix.filters.tasks").toLowerCase() })}</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Meetings */}
                                        {filters.showMeetings && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                                    <CalendarIcon className="size-4" /> {t("navigation.meetings")} ({requirement.meetings.length})
                                                </h4>
                                                {requirement.meetings.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {requirement.meetings.map((meeting) => (
                                                            <li key={meeting.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                                • {meeting.title}
                                                                <span className="text-xs text-zinc-500 ml-1">
                                                                    ({new Date(meeting.date).toLocaleDateString()})
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-zinc-400 italic">{t("requirements.matrix.noLinked", { item: t("requirements.matrix.filters.meetings").toLowerCase() })}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TraceabilityMatrixDialog;