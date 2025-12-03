import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  Target,
  Clock,
  ChevronRight
} from "lucide-react";

const StakeholderRegister = ({
  stakeholders,
  projects,
  onUpdate,
  getEngagementStrategy,
  getInfluenceColor,
  getInterestColor
}) => {
  const { t } = useTranslation();
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [activeView, setActiveView] = useState("list");
  const [historyEntry, setHistoryEntry] = useState({
    type: "meeting",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    concerns: "",
    nextSteps: ""
  });

  // Group stakeholders by project
  const stakeholdersByProject = projects.map(project => ({
    project,
    stakeholders: stakeholders.filter(s => s.projectId === project.id)
  }));

  // Calculate salience score
  const calculateSalience = (stakeholder) => {
    const weights = {
      influence: { high: 3, medium: 2, low: 1 },
      interest: { high: 3, medium: 2, low: 1 },
      power: { high: 3, medium: 2, low: 1 },
      impact: { high: 3, medium: 2, low: 1 }
    };

    const score = 
      (weights.influence[stakeholder.influence] || 0) +
      (weights.interest[stakeholder.interest] || 0) +
      (weights.power[stakeholder.power || 'medium'] || 0) +
      (weights.impact[stakeholder.impact || 'medium'] || 0);

    return score / 12 * 100; // Normalize to 0-100
  };

  const getSalienceColor = (score) => {
    if (score >= 75) return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
    if (score >= 25) return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
    return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
  };

  const addHistoryEntry = () => {
    if (!selectedStakeholder || !historyEntry.notes) return;
    
    const entry = {
      ...historyEntry,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    const updatedHistory = [
      ...(selectedStakeholder.history || []),
      entry
    ];

    onUpdate(selectedStakeholder.id, { history: updatedHistory });
    
    // Reset form
    setHistoryEntry({
      type: "meeting",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      concerns: "",
      nextSteps: ""
    });
  };

  const renderStakeholderCard = (stakeholder) => {
    const strategy = getEngagementStrategy(stakeholder.influence, stakeholder.interest);
    const salience = calculateSalience(stakeholder);
    
    return (
      <div
        key={stakeholder.id}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedStakeholder(stakeholder)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {stakeholder.name?.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {stakeholder.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                {stakeholder.role}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSalienceColor(salience)}`}>
            {Math.round(salience)}{t('stakeholders.percentSalience')}
          </div>
        </div>

        {/* Organization & Contact */}
        <div className="space-y-2 mb-3">
          {stakeholder.organization && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Building className="w-4 h-4" />
              <span>{stakeholder.organization}</span>
            </div>
          )}
          {stakeholder.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Mail className="w-4 h-4" />
              <span className="truncate">{stakeholder.email}</span>
            </div>
          )}
          {stakeholder.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Phone className="w-4 h-4" />
              <span>{stakeholder.phone}</span>
            </div>
          )}
          {stakeholder.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span>{stakeholder.location}</span>
            </div>
          )}
        </div>

        {/* Matrix Attributes */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-zinc-500">{t('stakeholders.influenceInterest')}</span>
            <div className="flex gap-1 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded capitalize ${getInfluenceColor(stakeholder.influence)}`}>
                {stakeholder.influence[0]?.toUpperCase()}/{stakeholder.interest[0]?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-zinc-500">{t('stakeholders.powerImpact')}</span>
            <div className="flex gap-1 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded capitalize ${getInfluenceColor(stakeholder.power || 'medium')}`}>
                {(stakeholder.power || 'M')[0]?.toUpperCase()}/{(stakeholder.impact || 'M')[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Engagement Strategy */}
        <div className={`p-2 rounded-md ${strategy.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{strategy.strategy}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* History Indicator */}
        {stakeholder.history?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-zinc-500">
                {stakeholder.history.length} {t('stakeholders.interactionsLogged')}
              </span>
              <span className="text-gray-500 dark:text-zinc-500">
                {t('stakeholders.last')} {new Date(stakeholder.history[stakeholder.history.length - 1].timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("list")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              activeView === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.register.listView")}
          </button>
          <button
            onClick={() => setActiveView("grouped")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              activeView === "grouped"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.register.groupedView")}
          </button>
        </div>

        {selectedStakeholder && (
          <button
            onClick={() => setSelectedStakeholder(null)}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {t("stakeholders.register.clearSelection")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stakeholder List/Grid */}
        <div className="lg:col-span-2">
          {activeView === "list" ? (
            <div className="grid gap-4">
              {stakeholders.map(renderStakeholderCard)}
            </div>
          ) : (
            <div className="space-y-6">
              {stakeholdersByProject.map(({ project, stakeholders: projectStakeholders }) => (
                <div key={project.id}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {project.name}
                  </h3>
                  {projectStakeholders.length > 0 ? (
                    <div className="grid gap-4">
                      {projectStakeholders.map(renderStakeholderCard)}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-zinc-500 text-sm">
                      {t("stakeholders.register.noStakeholdersInProject")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedStakeholder ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {t("stakeholders.register.stakeholderDetails")}
              </h3>

              {/* Stakeholder Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {selectedStakeholder.name?.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {selectedStakeholder.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {selectedStakeholder.role}
                    </p>
                  </div>
                </div>

                {/* Engagement Strategy */}
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    {t("stakeholders.register.engagementStrategy")}
                  </h5>
                  <div className={`p-2 rounded ${getEngagementStrategy(selectedStakeholder.influence, selectedStakeholder.interest).color}`}>
                    <span className="text-sm font-medium">
                      {getEngagementStrategy(selectedStakeholder.influence, selectedStakeholder.interest).strategy}
                    </span>
                  </div>
                  {selectedStakeholder.engagementApproach && (
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2">
                      {selectedStakeholder.engagementApproach}
                    </p>
                  )}
                  {selectedStakeholder.communicationPlan && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        {selectedStakeholder.communicationPlan}
                      </span>
                    </div>
                  )}
                </div>

                {/* History Log Form */}
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                    {t("stakeholders.register.addHistoryEntry")}
                  </h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                        {t("stakeholders.register.interactionType")}
                      </label>
                      <select
                        value={historyEntry.type}
                        onChange={(e) => setHistoryEntry({ ...historyEntry, type: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                      >
                        <option value="meeting">{t("stakeholders.register.meeting")}</option>
                        <option value="call">{t("stakeholders.register.call")}</option>
                        <option value="email">{t("stakeholders.register.email")}</option>
                        <option value="workshop">{t("stakeholders.register.workshop")}</option>
                        <option value="other">{t("stakeholders.register.other")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                        {t("stakeholders.register.date")}
                      </label>
                      <input
                        type="date"
                        value={historyEntry.date}
                        onChange={(e) => setHistoryEntry({ ...historyEntry, date: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                        {t("stakeholders.register.notes")}
                      </label>
                      <textarea
                        value={historyEntry.notes}
                        onChange={(e) => setHistoryEntry({ ...historyEntry, notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        placeholder={t("stakeholders.register.notesPlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                        {t("stakeholders.register.concerns")}
                      </label>
                      <textarea
                        value={historyEntry.concerns}
                        onChange={(e) => setHistoryEntry({ ...historyEntry, concerns: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        placeholder={t("stakeholders.register.concernsPlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                        {t("stakeholders.register.nextSteps")}
                      </label>
                      <textarea
                        value={historyEntry.nextSteps}
                        onChange={(e) => setHistoryEntry({ ...historyEntry, nextSteps: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        placeholder={t("stakeholders.register.nextStepsPlaceholder")}
                      />
                    </div>

                    <button
                      onClick={addHistoryEntry}
                      disabled={!historyEntry.notes}
                      className="w-full px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition"
                    >
                      {t("stakeholders.register.addEntry")}
                    </button>
                  </div>
                </div>

                {/* Recent History */}
                {selectedStakeholder.history?.length > 0 && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                      {t("stakeholders.register.recentHistory")}
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedStakeholder.history.slice(-3).reverse().map((entry, index) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{entry.type}</span>
                            <span className="text-gray-500">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-zinc-400">{entry.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
              <p className="text-gray-500 dark:text-zinc-500">
                {t("stakeholders.register.selectStakeholder")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeholderRegister;