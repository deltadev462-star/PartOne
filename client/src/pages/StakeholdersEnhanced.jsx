import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Shield,
  Upload,
  Activity,
  MessageSquare,
  Grid2X2,
  FileText,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Building2,
  Zap,
  Target,
  AlertCircle
} from "lucide-react";

// Import existing components
import StakeholderModal from "../components/stakeholders/StakeholderModal";
import StakeholderDetailView from "../components/stakeholders/StakeholderDetailView";
import MatrixView from "../components/stakeholders/MatrixView";
import StatsCards from "../components/stakeholders/StatsCards";
import FilterPanel from "../components/stakeholders/FilterPanel";
import StakeholderTable from "../components/stakeholders/StakeholderTable";
import DeleteConfirmModal from "../components/stakeholders/DeleteConfirmModal";

// Import new components (to be created)
import StakeholderRegister from "../components/stakeholders/StakeholderRegister";
import PowerInterestHeatmap from "../components/stakeholders/PowerInterestHeatmap";
import EngagementPlanning from "../components/stakeholders/EngagementPlanning";
import EngagementLog from "../components/stakeholders/EngagementLog";
import StakeholderAnalytics from "../components/stakeholders/StakeholderAnalytics";
import DataQualityDashboard from "../components/stakeholders/DataQualityDashboard";
import ImportExportTool from "../components/stakeholders/ImportExportTool";

const StakeholdersEnhanced = () => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  
  // Main state management
  const [activeTab, setActiveTab] = useState("overview");
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showMatrixView, setShowMatrixView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Engagement data
  const [engagementPlans, setEngagementPlans] = useState([]);
  const [engagementLogs, setEngagementLogs] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    sentimentTrends: [],
    activityTrends: [],
    engagementScores: []
  });
  
  // Data quality
  const [dataQualityIssues, setDataQualityIssues] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    influence: [],
    interest: [],
    category: [],
    project: [],
    organization: [],
    power: [],
    impact: []
  });
  
  const currentWorkspace = useSelector(
    (state) => state?.workspace?.currentWorkspace || null
  );
  const projects = currentWorkspace?.projects || [];
  
  // Fetch all data on mount
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchAllData();
    }
  }, [currentWorkspace]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch stakeholders
      const stakeholdersRes = await api.get(
        `/api/stakeholders/workspace/${currentWorkspace.id}`,
        { headers }
      );
      setStakeholders(stakeholdersRes.data.stakeholders || []);
      
      // Fetch engagement plans
      const plansRes = await api.get(
        `/api/stakeholders/engagement-plans/workspace/${currentWorkspace.id}`,
        { headers }
      ).catch(() => ({ data: { plans: [] } }));
      setEngagementPlans(plansRes.data.plans || []);
      
      // Fetch engagement logs
      const logsRes = await api.get(
        `/api/stakeholders/engagement-logs/workspace/${currentWorkspace.id}`,
        { headers }
      ).catch(() => ({ data: { logs: [] } }));
      setEngagementLogs(logsRes.data.logs || []);
      
      // Fetch analytics data
      const analyticsRes = await api.get(
        `/api/stakeholders/analytics/workspace/${currentWorkspace.id}`,
        { headers }
      ).catch(() => ({ data: {} }));
      setAnalyticsData(analyticsRes.data || {
        sentimentTrends: [],
        activityTrends: [],
        engagementScores: []
      });
      
      // Fetch data quality issues
      const qualityRes = await api.get(
        `/api/stakeholders/data-quality/workspace/${currentWorkspace.id}`,
        { headers }
      ).catch(() => ({ data: { issues: [] } }));
      setDataQualityIssues(qualityRes.data.issues || []);
      
    } catch (error) {
      console.error("Error fetching stakeholder data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // CRUD operations
  const createStakeholder = async (data) => {
    try {
      const token = await getToken();
      const response = await api.post(
        `/api/stakeholders`,
        { ...data, workspaceId: currentWorkspace.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStakeholders([...stakeholders, response.data.stakeholder]);
      setShowCreateModal(false);
      await fetchAllData(); // Refresh all data
    } catch (error) {
      console.error("Error creating stakeholder:", error);
    }
  };
  
  const updateStakeholder = async (id, data) => {
    try {
      const token = await getToken();
      const response = await api.put(
        `/api/stakeholders/${id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStakeholders(stakeholders.map(s =>
        s.id === id ? response.data.stakeholder : s
      ));
      await fetchAllData(); // Refresh all data
    } catch (error) {
      console.error("Error updating stakeholder:", error);
    }
  };
  
  const deleteStakeholder = (stakeholder) => {
    setStakeholderToDelete(stakeholder);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteStakeholder = async () => {
    if (!stakeholderToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = await getToken();
      await api.delete(
        `/api/stakeholders/${stakeholderToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStakeholders(stakeholders.filter(s => s.id !== stakeholderToDelete.id));
      setShowDeleteModal(false);
      setStakeholderToDelete(null);
      await fetchAllData(); // Refresh all data
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Engagement operations
  const createEngagementPlan = async (data) => {
    try {
      const token = await getToken();
      const response = await api.post(
        `/api/stakeholders/engagement-plans`,
        { ...data, workspaceId: currentWorkspace.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEngagementPlans([...engagementPlans, response.data.plan]);
    } catch (error) {
      console.error("Error creating engagement plan:", error);
    }
  };
  
  const logEngagement = async (data) => {
    try {
      const token = await getToken();
      const response = await api.post(
        `/api/stakeholders/engagement-logs`,
        { ...data, workspaceId: currentWorkspace.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEngagementLogs([...engagementLogs, response.data.log]);
      await fetchAllData(); // Refresh to get updated sentiment data
    } catch (error) {
      console.error("Error logging engagement:", error);
    }
  };
  
  // Helper functions
  const getEngagementStrategy = (influence, interest) => {
    if (influence === "high" && interest === "high") {
      return {
        strategy: t("stakeholders.strategies.manageClosely"),
        color: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
        description: t("stakeholders.strategyDescriptions.manageClosely")
      };
    }
    if (influence === "high" && interest === "low") {
      return {
        strategy: t("stakeholders.strategies.keepSatisfied"),
        color: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
        description: t("stakeholders.strategyDescriptions.keepSatisfied")
      };
    }
    if (influence === "low" && interest === "high") {
      return {
        strategy: t("stakeholders.strategies.keepInformed"),
        color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
        description: t("stakeholders.strategyDescriptions.keepInformed")
      };
    }
    return {
      strategy: t("stakeholders.strategies.monitor"),
      color: "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400",
      description: t("stakeholders.strategyDescriptions.monitor")
    };
  };
  
  const getInfluenceColor = (level) => {
    switch (level) {
      case "high":
        return "bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "low":
        return "bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
    }
  };
  
  const getInterestColor = (level) => {
    switch (level) {
      case "high":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400";
      case "medium":
        return "bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
    }
  };
  
  // Filter functions
  const toggleFilter = (category, value) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      influence: [],
      interest: [],
      category: [],
      project: [],
      organization: [],
      power: [],
      impact: []
    });
  };
  
  const filteredStakeholders = stakeholders.filter((stakeholder) => {
    const matchesSearch =
      !searchTerm ||
      stakeholder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesInfluence =
      filters.influence.length === 0 ||
      filters.influence.includes(stakeholder.influence);
    
    const matchesInterest =
      filters.interest.length === 0 ||
      filters.interest.includes(stakeholder.interest);
    
    const matchesCategory =
      filters.category.length === 0 ||
      filters.category.includes(stakeholder.category);
    
    const matchesProject =
      filters.project.length === 0 ||
      filters.project.includes(stakeholder.projectId);
    
    const matchesOrganization =
      filters.organization.length === 0 ||
      filters.organization.includes(stakeholder.organization);
    
    const matchesPower =
      filters.power.length === 0 ||
      filters.power.includes(stakeholder.power);
    
    const matchesImpact =
      filters.impact.length === 0 ||
      filters.impact.includes(stakeholder.impact);
    
    return (
      matchesSearch &&
      matchesInfluence &&
      matchesInterest &&
      matchesCategory &&
      matchesProject &&
      matchesOrganization &&
      matchesPower &&
      matchesImpact
    );
  });
  
  // Get matrix data for visualizations
  const getMatrixData = () => {
    const matrix = {
      "high-high": [],
      "high-medium": [],
      "high-low": [],
      "medium-high": [],
      "medium-medium": [],
      "medium-low": [],
      "low-high": [],
      "low-medium": [],
      "low-low": [],
    };
    
    filteredStakeholders.forEach((stakeholder) => {
      const key = `${stakeholder.influence}-${stakeholder.interest}`;
      if (matrix[key]) {
        matrix[key].push(stakeholder);
      }
    });
    
    return matrix;
  };
  
  // Tab configuration
  const tabs = [
    { id: "overview", label: t("stakeholders.tabs.overview"), icon: Users },
    { id: "register", label: t("stakeholders.tabs.register"), icon: UserCheck },
    { id: "heatmap", label: t("stakeholders.tabs.heatmap"), icon: Grid2X2 },
    { id: "planning", label: t("stakeholders.tabs.planning"), icon: Calendar },
    { id: "tracker", label: t("stakeholders.tabs.tracker"), icon: MessageSquare },
    { id: "analytics", label: t("stakeholders.tabs.analytics"), icon: TrendingUp },
    { id: "quality", label: t("stakeholders.tabs.dataQuality"), icon: Shield },
    { id: "import", label: t("stakeholders.tabs.import"), icon: Upload }
  ];
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <FilterPanel
              showFilterPanel={showFilterPanel}
              filters={filters}
              toggleFilter={toggleFilter}
              clearFilters={clearFilters}
              projects={projects}
              stakeholders={stakeholders}
            />
            
            {filteredStakeholders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {stakeholders.length === 0
                    ? t("stakeholders.noStakeholders")
                    : t("stakeholders.noStakeholdersMatch")}
                </h3>
                <p className="text-gray-500 dark:text-zinc-400 mb-6">
                  {stakeholders.length === 0
                    ? t("stakeholders.addFirstStakeholder")
                    : t("stakeholders.adjustSearch")}
                </p>
              </div>
            ) : (
              <StakeholderTable
                filteredStakeholders={filteredStakeholders}
                getEngagementStrategy={getEngagementStrategy}
                getInfluenceColor={getInfluenceColor}
                openStakeholderDetail={(stakeholder) => {
                  setSelectedStakeholder(stakeholder);
                  setShowDetailView(true);
                }}
                setSelectedStakeholder={setSelectedStakeholder}
                setShowCreateModal={setShowCreateModal}
                deleteStakeholder={deleteStakeholder}
              />
            )}
          </div>
        );
      
      case "register":
        return (
          <StakeholderRegister
            stakeholders={filteredStakeholders}
            projects={projects}
            onUpdate={updateStakeholder}
            getEngagementStrategy={getEngagementStrategy}
            getInfluenceColor={getInfluenceColor}
            getInterestColor={getInterestColor}
          />
        );
      
      case "heatmap":
        return (
          <PowerInterestHeatmap
            stakeholders={filteredStakeholders}
            projects={projects}
            getMatrixData={getMatrixData}
            openStakeholderDetail={(stakeholder) => {
              setSelectedStakeholder(stakeholder);
              setShowDetailView(true);
            }}
          />
        );
      
      case "planning":
        return (
          <EngagementPlanning
            stakeholders={filteredStakeholders}
            engagementPlans={engagementPlans}
            projects={projects}
            onCreatePlan={createEngagementPlan}
            onUpdatePlan={async (id, data) => {
              try {
                const token = await getToken();
                await api.put(
                  `/api/stakeholders/engagement-plans/${id}`,
                  data,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                await fetchAllData();
              } catch (error) {
                console.error("Error updating plan:", error);
              }
            }}
          />
        );
      
      case "tracker":
        return (
          <EngagementLog
            stakeholders={filteredStakeholders}
            engagementLogs={engagementLogs}
            onLogEngagement={logEngagement}
            projects={projects}
          />
        );
      
      case "analytics":
        return (
          <StakeholderAnalytics
            stakeholders={filteredStakeholders}
            engagementLogs={engagementLogs}
            analyticsData={analyticsData}
            projects={projects}
          />
        );
      
      case "quality":
        return (
          <DataQualityDashboard
            stakeholders={stakeholders}
            dataQualityIssues={dataQualityIssues}
            auditLogs={auditLogs}
            onResolveIssue={async (issueId) => {
              try {
                const token = await getToken();
                await api.post(
                  `/api/stakeholders/data-quality/resolve/${issueId}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                await fetchAllData();
              } catch (error) {
                console.error("Error resolving issue:", error);
              }
            }}
          />
        );
      
      case "import":
        return (
          <ImportExportTool
            stakeholders={stakeholders}
            onImport={async (data) => {
              try {
                const token = await getToken();
                await api.post(
                  `/api/stakeholders/import`,
                  { data, workspaceId: currentWorkspace.id },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                await fetchAllData();
              } catch (error) {
                console.error("Error importing data:", error);
              }
            }}
            onExport={async () => {
              try {
                const token = await getToken();
                const response = await api.get(
                  `/api/stakeholders/export/workspace/${currentWorkspace.id}`,
                  { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
                );
                
                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `stakeholders_${new Date().toISOString()}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (error) {
                console.error("Error exporting data:", error);
              }
            }}
          />
        );
      
      default:
        return null;
    }
  };
  
  // Calculate statistics
  const stats = {
    total: stakeholders.length,
    highInfluence: stakeholders.filter(s => s.influence === "high").length,
    organizations: [...new Set(stakeholders.map(s => s.organization))].length,
    activeEngagements: engagementPlans.filter(p => p.status === "active").length
  };

  return (
    <div className="min-h-screen  ">
      <div className="space-y-6 w-full px-4 lg:px-6 xl:px-8 py-6">
        {/* Enhanced Header Section - Mobile Responsive */}
        <div className="  p-4 sm:p-6">
          <div className=" ">
          
            
            {/* Actions - Grid on Mobile, Flex on Desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setShowMatrixView(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
              >
                <Grid2X2 className="w-4 h-4" />
                <span className="hidden xs:inline">{t("stakeholders.viewMatrix")}</span>
              </button>
              <button
                onClick={() => setActiveTab("import")}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden xs:inline">{t("common.import")}</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t("stakeholders.addStakeholder")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("stakeholders.totalStakeholders")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {t('stakeholders.growthPercent', { percent: 12 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("stakeholders.highInfluence")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.highInfluence}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {t('stakeholders.criticalStakeholders')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("stakeholders.organizations")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.organizations}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {t('stakeholders.partnerOrganizations')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("stakeholders.activeEngagements")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.activeEngagements}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {t('stakeholders.ongoingActivities')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      
        {/* Main Content Area - Mobile Responsive */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Enhanced Tab Navigation - Mobile Scrollable Grid */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            {/* Mobile Grid Tabs - 2x4 Grid Layout */}
            <div className="block sm:hidden">
              <div className="grid grid-cols-2 gap-2 p-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        col-span-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg text-xs font-medium transition-all min-h-[60px]
                        ${isActive
                          ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="truncate w-full text-center leading-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop/Tablet Flex Tabs - Horizontal Layout */}
            <nav className="hidden sm:flex items-center px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                      ${isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Enhanced Search and Filter Bar - Mobile Responsive */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  placeholder={t("stakeholders.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 bg-gray-50"
                />
              </div>
              {activeTab === "overview" && (
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`
                    flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all text-sm
                    ${showFilterPanel
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    }
                  `}
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">{t("stakeholders.filters")}</span>
                  {Object.values(filters).flat().length > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                      {Object.values(filters).flat().length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Content with responsive padding */}
          <div className="p-3 sm:p-4 lg:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 text-xs sm:text-sm text-center">
                  {t("stakeholders.loadingStakeholders")}
                </p>
              </div>
            ) : (
              <div className="min-h-[300px] sm:min-h-[400px]">
                {renderTabContent()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <StakeholderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedStakeholder(null);
        }}
        stakeholder={selectedStakeholder}
        projects={projects}
        createStakeholder={createStakeholder}
        updateStakeholder={updateStakeholder}
        getEngagementStrategy={getEngagementStrategy}
      />
      
      <StakeholderDetailView
        showDetailView={showDetailView}
        selectedStakeholder={selectedStakeholder}
        setShowDetailView={setShowDetailView}
        setShowCreateModal={setShowCreateModal}
        activeTab="profile"
        setActiveTab={() => {}}
        getEngagementStrategy={getEngagementStrategy}
        getInfluenceColor={getInfluenceColor}
        getInterestColor={getInterestColor}
        addHistoryEntry={async (stakeholderId, entry) => {
          try {
            const token = await getToken();
            await api.post(
              `/api/stakeholders/${stakeholderId}/history`,
              entry,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchAllData();
          } catch (error) {
            console.error("Error adding history entry:", error);
          }
        }}
        openStakeholderDetail={(stakeholder) => {
          setSelectedStakeholder(stakeholder);
          setShowDetailView(true);
        }}
      />
      
      <MatrixView
        showMatrixView={showMatrixView}
        setShowMatrixView={setShowMatrixView}
        getMatrixData={getMatrixData}
        openStakeholderDetail={(stakeholder) => {
          setSelectedStakeholder(stakeholder);
          setShowDetailView(true);
        }}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setStakeholderToDelete(null);
          }
        }}
        onConfirm={confirmDeleteStakeholder}
        stakeholderName={stakeholderToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default StakeholdersEnhanced;