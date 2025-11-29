import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus, Search, FolderOpen, Archive, Download, Upload, FileSpreadsheet, FileText, FileImage } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import CreateProjectDialog from "../components/CreateProjectDialog";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import {
    exportProjectsToExcel,
    exportProjectsToCSV,
    exportProjectsToPDF,
    importProjectsFromExcel,
    downloadProjectTemplate,
    parseExcelFile
} from "../utils/exportImportUtils";

export default function Projects() {
    const projects = useSelector(
        (state) => state?.workspace?.currentWorkspace?.projects || []
    );
    const { t } = useTranslation();
    const { getToken } = useAuth();

    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [filters, setFilters] = useState({
        status: "ALL",
        priority: "ALL",
    });
    const [isImporting, setIsImporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showImportMenu, setShowImportMenu] = useState(false);

    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    const filterProjects = () => {
        let filtered = projects;

        // Filter by archived status
        filtered = filtered.filter((project) =>
            showArchived ? project.archived === true : (project.archived === false || !project.archived)
        );

        if (searchTerm) {
            filtered = filtered.filter(
                (project) =>
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.status !== "ALL") {
            filtered = filtered.filter((project) => project.status === filters.status);
        }

        if (filters.priority !== "ALL") {
            filtered = filtered.filter(
                (project) => project.priority === filters.priority
            );
        }

        setFilteredProjects(filtered);
    };

    useEffect(() => {
        filterProjects();
    }, [projects, searchTerm, filters, showArchived]);

    const handleExport = async (format) => {
        try {
            if (!currentWorkspace?.id) {
                toast.error(t("projects.selectWorkspace"));
                return;
            }

            const token = await getToken();
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            const exportFilters = {
                status: filters.status !== "ALL" ? filters.status : undefined,
                priority: filters.priority !== "ALL" ? filters.priority : undefined,
                archived: showArchived
            };

            switch (format) {
                case 'excel':
                    await exportProjectsToExcel(currentWorkspace.id, exportFilters, token);
                    toast.success(t("projects.exportSuccess"));
                    break;
                case 'csv':
                    await exportProjectsToCSV(currentWorkspace.id, exportFilters, token);
                    toast.success(t("projects.exportSuccess"));
                    break;
                case 'pdf':
                    await exportProjectsToPDF(currentWorkspace.id, exportFilters, token);
                    toast.success(t("projects.exportSuccess"));
                    break;
                default:
                    break;
            }
            setShowExportMenu(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error(t("projects.exportError"));
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!currentWorkspace?.id) {
            toast.error(t("projects.selectWorkspace"));
            return;
        }

        const token = await getToken();
        if (!token) {
            toast.error("Authentication required");
            return;
        }

        setIsImporting(true);
        try {
            const result = await importProjectsFromExcel(currentWorkspace.id, file, token);
            toast.success(result.message || t("projects.importSuccess"));
            // Refresh projects list
            window.location.reload();
        } catch (error) {
            console.error("Import error:", error);
            const errorMsg = error.response?.data?.message || t("projects.importError");
            toast.error(errorMsg);
            
            // Show validation errors if any
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => toast.error(err));
            }
        } finally {
            setIsImporting(false);
            event.target.value = '';
            setShowImportMenu(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Authentication required");
                return;
            }

            await downloadProjectTemplate(token);
            toast.success(t("projects.templateDownloaded"));
            setShowImportMenu(false);
        } catch (error) {
            console.error("Template download error:", error);
            toast.error(t("projects.templateDownloadError"));
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">{t("projects.title")}</h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">{t("projects.subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center px-4 py-2 text-sm rounded transition ${
                            showArchived
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-700'
                        }`}
                    >
                        <Archive className="size-4 mr-2" />
                        {showArchived ? t("projects.hideArchived") : t("projects.showArchived")}
                    </button>

                    {/* Export Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition"
                        >
                            <Download className="size-4 mr-2" />
                            {t("projects.export")}
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FileSpreadsheet className="size-4 mr-2" />
                                    {t("projects.exportToExcel")}
                                </button>
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FileText className="size-4 mr-2" />
                                    {t("projects.exportToCSV")}
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FileImage className="size-4 mr-2" />
                                    {t("projects.exportToPDF")}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Import Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowImportMenu(!showImportMenu)}
                            className="flex items-center px-4 py-2 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 transition"
                            disabled={isImporting}
                        >
                            <Upload className="size-4 mr-2" />
                            {isImporting ? t("projects.importing") : t("projects.import")}
                        </button>
                        {showImportMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                                <label className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <FileSpreadsheet className="size-4 mr-2" />
                                    {t("projects.importFromExcel")}
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleImport}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Download className="size-4 mr-2" />
                                    {t("projects.downloadTemplate")}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
                    >
                        <Plus className="size-4 mr-2" /> {t("projects.newProject")}
                    </button>
                </div>
                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 w-4 h-4" />
                    <input
                        placeholder={t("projects.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:border-blue-500 outline-none"
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                >
                    <option value="ALL">{t("projects.allStatus")}</option>
                    <option value="ACTIVE">{t("project.status.active")}</option>
                    <option value="PLANNING">{t("project.status.planning")}</option>
                    <option value="COMPLETED">{t("project.status.completed")}</option>
                    <option value="ON_HOLD">{t("project.status.onHold")}</option>
                    <option value="CANCELLED">{t("project.status.cancelled")}</option>
                </select>
                <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                >
                    <option value="ALL">{t("projects.allPriority")}</option>
                    <option value="HIGH">{t("project.priority.high")}</option>
                    <option value="MEDIUM">{t("project.priority.medium")}</option>
                    <option value="LOW">{t("project.priority.low")}</option>
                </select>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t("projects.noProjectsFound")}
                        </h3>
                        <p className="text-gray-500 dark:text-zinc-400 mb-6 text-sm">
                            {t("projects.createFirstProject")}
                        </p>
                        <button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mx-auto text-sm" >
                            <Plus className="size-4" />
                            {t("projects.createProject")}
                        </button>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            showArchived={showArchived}
                        />
                    ))
                )}
            </div>

            {/* Click outside to close menus */}
            {(showExportMenu || showImportMenu) && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => {
                        setShowExportMenu(false);
                        setShowImportMenu(false);
                    }}
                />
            )}
        </div>
    );
}
