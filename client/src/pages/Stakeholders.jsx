import { useEffect, useState } from "react";
import {
  Users2Icon,
  Search,
  UserPlus,
  Filter,
  Grid,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";

// Import extracted components
import StakeholderModal from "../components/stakeholders/StakeholderModal";
import StakeholderDetailView from "../components/stakeholders/StakeholderDetailView";
import MatrixView from "../components/stakeholders/MatrixView";
import StatsCards from "../components/stakeholders/StatsCards";
import FilterPanel from "../components/stakeholders/FilterPanel";
import StakeholderTable from "../components/stakeholders/StakeholderTable";
import DeleteConfirmModal from "../components/stakeholders/DeleteConfirmModal";

const Stakeholders = () => {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [stakeholders, setStakeholders] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMatrixView, setShowMatrixView] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState({
    influence: [],
    interest: [],
    category: [],
    project: [],
    organization: [],
  });

  const currentWorkspace = useSelector(
    (state) => state?.workspace?.currentWorkspace || null
  );
  const projects = currentWorkspace?.projects || [];

  // Fetch stakeholders from backend
  useEffect(() => {
    fetchStakeholders();
  }, [currentWorkspace]);

  const fetchStakeholders = async () => {
    if (!currentWorkspace?.id) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const response = await api.get(
        `/api/stakeholders/workspace/${currentWorkspace.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStakeholders(response.data.stakeholders || []);
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
    } finally {
      setLoading(false);
    }
  };

  const createStakeholder = async (data) => {
    try {
      const token = await getToken();
      const response = await api.post(
        `/api/stakeholders`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStakeholders([...stakeholders, response.data.stakeholder]);
      setShowCreateModal(false);
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
    } catch (error) {
      console.error("Error deleting stakeholder:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const addHistoryEntry = async (stakeholderId, entry) => {
    try {
      const token = await getToken();
      await api.post(
        `/api/stakeholders/${stakeholderId}/history`,
        entry,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStakeholders(); // Refresh data
    } catch (error) {
      console.error("Error adding history entry:", error);
    }
  };

  const filteredStakeholders = stakeholders.filter((stakeholder) => {
    // Text search
    const matchesSearch =
      !searchTerm ||
      stakeholder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply filters
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

    return (
      matchesSearch &&
      matchesInfluence &&
      matchesInterest &&
      matchesCategory &&
      matchesProject &&
      matchesOrganization
    );
  });

  // Group stakeholders for matrix view
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
    });
  };

  const openStakeholderDetail = (stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setShowDetailView(true);
    setShowMatrixView(false);
    setActiveTab("profile");
  };

  return (
    <div className="space-y-6 w-full px-4 lg:px-6 xl:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t("stakeholders.title")}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            {t("stakeholders.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMatrixView(true)}
            className="flex items-center px-4 py-2 rounded text-sm border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            <Grid className="size-4 mr-2" />
            {t("stakeholders.matrixView")}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition"
          >
            <UserPlus className="w-4 h-4 mx-2" />
            {t("stakeholders.addStakeholder")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stakeholders={stakeholders} projects={projects} />

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3" />
          <input
            placeholder={t("stakeholders.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 px-4 w-full text-sm rounded-md border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500 dark:bg-zinc-900"
          />
        </div>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-800 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          <Filter className="size-4" />
          <span className="text-sm">{t("stakeholders.filters")}</span>
          {Object.values(filters).flat().length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
              {Object.values(filters).flat().length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        showFilterPanel={showFilterPanel}
        filters={filters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        projects={projects}
        stakeholders={stakeholders}
      />

      {/* Stakeholders List/Table */}
      <div className="w-full">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-zinc-400 mt-4">{t("stakeholders.loadingStakeholders")}</p>
          </div>
        ) : filteredStakeholders.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Users2Icon className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
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
            openStakeholderDetail={openStakeholderDetail}
            setSelectedStakeholder={setSelectedStakeholder}
            setShowCreateModal={setShowCreateModal}
            deleteStakeholder={deleteStakeholder}
          />
        )}
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        getEngagementStrategy={getEngagementStrategy}
        getInfluenceColor={getInfluenceColor}
        getInterestColor={getInterestColor}
        addHistoryEntry={addHistoryEntry}
        openStakeholderDetail={openStakeholderDetail}
      />
      
      <MatrixView
        showMatrixView={showMatrixView}
        setShowMatrixView={setShowMatrixView}
        getMatrixData={getMatrixData}
        openStakeholderDetail={openStakeholderDetail}
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

export default Stakeholders;
