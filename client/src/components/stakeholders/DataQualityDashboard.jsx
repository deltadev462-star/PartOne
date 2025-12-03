import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  FileSearch,
  UserX,
  Users,
  Mail,
  Clock,
  Calendar,
  Activity,
  AlertCircle,
  Filter,
  Download,
  Trash2,
  Edit,
  History,
  TrendingUp,
  Search,
  ChevronRight
} from "lucide-react";

const DataQualityDashboard = ({
  stakeholders,
  dataQualityIssues = [],
  auditLogs = [],
  onResolveIssue
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("issues"); // issues, audit, health
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolution, setResolution] = useState("");

  // Detect data quality issues automatically
  const detectedIssues = useMemo(() => {
    const issues = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,11}$/;
    
    stakeholders.forEach(stakeholder => {
      // Missing email
      if (!stakeholder.email) {
        issues.push({
          id: `missing-email-${stakeholder.id}`,
          type: "MissingEmail",
          severity: "medium",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.missingEmailDesc"),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      } else if (!emailRegex.test(stakeholder.email)) {
        // Invalid email format
        issues.push({
          id: `invalid-email-${stakeholder.id}`,
          type: "InvalidEmail",
          severity: "high",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.invalidEmailDesc", { email: stakeholder.email }),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      }
      
      // Missing phone
      if (!stakeholder.phone) {
        issues.push({
          id: `missing-phone-${stakeholder.id}`,
          type: "MissingPhone",
          severity: "low",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.missingPhoneDesc"),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      } else if (!phoneRegex.test(stakeholder.phone.replace(/\D/g, ''))) {
        // Invalid phone format
        issues.push({
          id: `invalid-phone-${stakeholder.id}`,
          type: "InvalidPhone",
          severity: "medium",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.invalidPhoneDesc", { phone: stakeholder.phone }),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      }
      
      // Missing organization
      if (!stakeholder.organization) {
        issues.push({
          id: `missing-org-${stakeholder.id}`,
          type: "MissingOrganization",
          severity: "low",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.missingOrgDesc"),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      }
      
      // Stale record (no engagement in 90+ days)
      if (stakeholder.lastEngagementDate) {
        const daysSinceEngagement = Math.floor(
          (Date.now() - new Date(stakeholder.lastEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceEngagement > 90) {
          issues.push({
            id: `stale-${stakeholder.id}`,
            type: "StaleRecord",
            severity: "medium",
            stakeholderId: stakeholder.id,
            stakeholderName: stakeholder.name,
            description: t("stakeholders.dataQuality.staleRecordDesc", { days: daysSinceEngagement }),
            detectedAt: new Date().toISOString(),
            status: "open"
          });
        }
      }
      
      // Unclassified stakeholder
      if (!stakeholder.category || stakeholder.category === "unclassified") {
        issues.push({
          id: `unclassified-${stakeholder.id}`,
          type: "Unclassified",
          severity: "low",
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          description: t("stakeholders.dataQuality.unclassifiedDesc"),
          detectedAt: new Date().toISOString(),
          status: "open"
        });
      }
    });
    
    // Check for duplicates
    const nameMap = {};
    stakeholders.forEach(stakeholder => {
      const normalizedName = stakeholder.name?.toLowerCase().trim();
      if (normalizedName) {
        if (!nameMap[normalizedName]) {
          nameMap[normalizedName] = [];
        }
        nameMap[normalizedName].push(stakeholder);
      }
    });
    
    Object.entries(nameMap).forEach(([name, duplicates]) => {
      if (duplicates.length > 1) {
        duplicates.forEach((stakeholder, index) => {
          if (index > 0) {
            issues.push({
              id: `duplicate-${stakeholder.id}`,
              type: "Duplicate",
              severity: "high",
              stakeholderId: stakeholder.id,
              stakeholderName: stakeholder.name,
              description: t("stakeholders.dataQuality.duplicateDesc", { 
                original: duplicates[0].id 
              }),
              detectedAt: new Date().toISOString(),
              status: "open"
            });
          }
        });
      }
    });
    
    return issues;
  }, [stakeholders, t]);

  // Combine detected issues with stored issues
  const allIssues = useMemo(() => {
    const combinedIssues = [...detectedIssues];
    
    // Add stored issues that aren't already detected
    dataQualityIssues.forEach(storedIssue => {
      if (!combinedIssues.find(issue => issue.id === storedIssue.id)) {
        combinedIssues.push(storedIssue);
      }
    });
    
    return combinedIssues;
  }, [detectedIssues, dataQualityIssues]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return allIssues.filter(issue => {
      if (filterType !== "all" && issue.type !== filterType) return false;
      if (filterStatus !== "all" && issue.status !== filterStatus) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          issue.stakeholderName?.toLowerCase().includes(search) ||
          issue.description?.toLowerCase().includes(search) ||
          issue.type?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allIssues, filterType, filterStatus, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIssues = allIssues.length;
    const openIssues = allIssues.filter(i => i.status === "open").length;
    const resolvedIssues = allIssues.filter(i => i.status === "resolved").length;
    const criticalIssues = allIssues.filter(i => i.severity === "high").length;
    
    const issuesByType = {};
    allIssues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    });
    
    const completenessScore = stakeholders.length > 0
      ? Math.round((stakeholders.filter(s => 
          s.email && s.phone && s.organization && s.category
        ).length / stakeholders.length) * 100)
      : 0;
    
    return {
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues,
      issuesByType,
      completenessScore
    };
  }, [allIssues, stakeholders]);

  const getIssueIcon = (type) => {
    switch(type) {
      case "MissingEmail":
      case "InvalidEmail":
        return Mail;
      case "MissingPhone":
      case "InvalidPhone":
        return Clock;
      case "Duplicate":
        return Users;
      case "Unclassified":
        return UserX;
      case "StaleRecord":
        return Calendar;
      case "MissingOrganization":
        return Database;
      default:
        return AlertCircle;
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleResolveIssue = () => {
    if (selectedIssue && resolution) {
      onResolveIssue(selectedIssue.id, {
        resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: t('stakeholders.currentUser') // Should be actual user
      });
      setShowResolveModal(false);
      setSelectedIssue(null);
      setResolution("");
    }
  };

  const exportIssues = () => {
    const csvContent = [
      ["Data Quality Report"],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["Type", "Severity", "Stakeholder", "Description", "Status", "Detected"],
      ...filteredIssues.map(issue => [
        issue.type,
        issue.severity,
        issue.stakeholderName,
        issue.description,
        issue.status,
        new Date(issue.detectedAt).toLocaleString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_quality_issues_${new Date().toISOString()}.csv`;
    a.click();
  };

  const renderIssuesTab = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Issue Statistics - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.dataQuality.totalIssues")}
            </span>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 hidden sm:block" />
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats.totalIssues}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.dataQuality.openIssues")}
            </span>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 hidden sm:block" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.openIssues}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.dataQuality.critical")}
            </span>
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 hidden sm:block" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.criticalIssues}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.dataQuality.resolved")}
            </span>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 hidden sm:block" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.resolvedIssues}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.dataQuality.completeness")}
            </span>
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 hidden sm:block" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 sm:h-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${stats.completenessScore}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold">{stats.completenessScore}%</span>
          </div>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t("stakeholders.dataQuality.searchIssues")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 w-full text-xs sm:text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
        >
          <option value="all">{t("stakeholders.dataQuality.allTypes")}</option>
          <option value="MissingEmail">{t("stakeholders.dataQuality.missingEmail")}</option>
          <option value="InvalidEmail">{t("stakeholders.dataQuality.invalidEmail")}</option>
          <option value="MissingPhone">{t("stakeholders.dataQuality.missingPhone")}</option>
          <option value="InvalidPhone">{t("stakeholders.dataQuality.invalidPhone")}</option>
          <option value="Duplicate">{t("stakeholders.dataQuality.duplicate")}</option>
          <option value="Unclassified">{t("stakeholders.dataQuality.unclassified")}</option>
          <option value="StaleRecord">{t("stakeholders.dataQuality.staleRecord")}</option>
          <option value="MissingOrganization">{t("stakeholders.dataQuality.missingOrg")}</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
        >
          <option value="all">{t("stakeholders.dataQuality.allStatuses")}</option>
          <option value="open">{t("stakeholders.dataQuality.open")}</option>
          <option value="resolved">{t("stakeholders.dataQuality.resolved")}</option>
          <option value="ignored">{t("stakeholders.dataQuality.ignored")}</option>
        </select>

        <button
          onClick={exportIssues}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">{t("stakeholders.dataQuality.export")}</span>
          <span className="xs:hidden">{t("stakeholders.dataQuality.export")}</span>
        </button>
      </div>

      {/* Issues List - Mobile Responsive */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        {/* Mobile View */}
        <div className="sm:hidden">
          {filteredIssues.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredIssues.map(issue => {
                const Icon = getIssueIcon(issue.type);
                return (
                  <div key={issue.id} className="col-span-1 bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t(`stakeholders.dataQuality.${issue.type}`)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getSeverityColor(issue.severity)}`}>
                        {t(`stakeholders.dataQuality.severity.${issue.severity}`)}
                      </span>
                      {issue.status === "open" ? (
                        <span className="px-2 py-0.5 rounded-full font-medium text-orange-600 bg-orange-50">
                          {t("stakeholders.dataQuality.open")}
                        </span>
                      ) : issue.status === "resolved" ? (
                        <span className="px-2 py-0.5 rounded-full font-medium text-green-600 bg-green-50">
                          {t("stakeholders.dataQuality.resolved")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-medium text-gray-600 bg-gray-50">
                          {t("stakeholders.dataQuality.ignored")}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-gray-600 dark:text-zinc-400">
                        {issue.stakeholderName}
                      </p>
                      {issue.status === "open" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setShowResolveModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                            title={t("stakeholders.dataQuality.resolve")}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                            title={t("stakeholders.dataQuality.ignore")}
                          >
                            <XCircle className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-zinc-500 text-sm">
                {t("stakeholders.dataQuality.noIssues")}
              </p>
            </div>
          )}
        </div>
        
        {/* Desktop View with overflow handling */}
        <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.issue")}
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.stakeholder")}
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.severityLabel")}
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.detected")}
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.statusLabel")}
              </th>
              <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                {t("stakeholders.dataQuality.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {filteredIssues.length > 0 ? (
              filteredIssues.map(issue => {
                const Icon = getIssueIcon(issue.type);
                return (
                  <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {t(`stakeholders.dataQuality.${issue.type}`)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                        {issue.stakeholderName}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getSeverityColor(issue.severity)}`}>
                        {t(`stakeholders.dataQuality.severity.${issue.severity}`)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(issue.detectedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {issue.status === "open" ? (
                        <span className="px-2 py-1 text-xs rounded-full font-medium text-orange-600 bg-orange-50">
                          {t("stakeholders.dataQuality.open")}
                        </span>
                      ) : issue.status === "resolved" ? (
                        <span className="px-2 py-1 text-xs rounded-full font-medium text-green-600 bg-green-50">
                          {t("stakeholders.dataQuality.resolved")}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full font-medium text-gray-600 bg-gray-50">
                          {t("stakeholders.dataQuality.ignored")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                        {issue.status === "open" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedIssue(issue);
                                setShowResolveModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                              title={t("stakeholders.dataQuality.resolve")}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                              title={t("stakeholders.dataQuality.ignore")}
                            >
                              <XCircle className="w-4 h-4 text-gray-600" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                          title={t("stakeholders.dataQuality.viewDetails")}
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-zinc-500">
                    {t("stakeholders.dataQuality.noIssues")}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-800">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {t("stakeholders.dataQuality.auditLog")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-500 mt-1">
            {t("stakeholders.dataQuality.auditLogDesc")}
          </p>
        </div>
        
        {/* Mobile Card View */}
        <div className="sm:hidden">
          {auditLogs.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-zinc-800">
              {auditLogs.slice(0, 50).map((log, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium mb-2 ${
                          log.action === 'create' ? 'text-green-600 bg-green-50' :
                          log.action === 'update' ? 'text-blue-600 bg-blue-50' :
                          log.action === 'delete' ? 'text-red-600 bg-red-50' :
                          'text-gray-600 bg-gray-50'
                        }`}>
                          {t(`stakeholders.dataQuality.actions.${log.action}`) || log.action}
                        </span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.entity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-zinc-500 mb-1">
                          {t("stakeholders.dataQuality.user")}
                        </p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {log.user}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-zinc-500 mb-1">
                          {t("stakeholders.dataQuality.timestamp")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {log.changes && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                          {t("stakeholders.dataQuality.changes")}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-zinc-400">
                          {log.changes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-zinc-500 text-sm">
                {t("stakeholders.dataQuality.noAuditLogs")}
              </p>
            </div>
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("stakeholders.dataQuality.timestamp")}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("stakeholders.dataQuality.user")}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("stakeholders.dataQuality.action")}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("stakeholders.dataQuality.entity")}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t("stakeholders.dataQuality.changes")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 50).map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.user}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        log.action === 'create' ? 'text-green-600 bg-green-50' :
                        log.action === 'update' ? 'text-blue-600 bg-blue-50' :
                        log.action === 'delete' ? 'text-red-600 bg-red-50' :
                        'text-gray-600 bg-gray-50'
                      }`}>
                        {t(`stakeholders.dataQuality.actions.${log.action}`) || log.action}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.entity}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-xs text-gray-600 dark:text-zinc-400">
                        {log.changes}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-zinc-500">
                      {t("stakeholders.dataQuality.noAuditLogs")}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Data Completeness by Field */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {t("stakeholders.dataQuality.dataCompleteness")}
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              { field: "name", count: stakeholders.filter(s => s.name).length },
              { field: "email", count: stakeholders.filter(s => s.email).length },
              { field: "phone", count: stakeholders.filter(s => s.phone).length },
              { field: "organization", count: stakeholders.filter(s => s.organization).length },
              { field: "role", count: stakeholders.filter(s => s.role).length },
              { field: "category", count: stakeholders.filter(s => s.category).length }
            ].map(item => {
              const percentage = stakeholders.length > 0 
                ? Math.round(item.count / stakeholders.length * 100)
                : 0;
              
              return (
                <div key={item.field}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs sm:text-sm font-medium capitalize">
                      {t(`stakeholders.dataQuality.field.${item.field}`)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
                      {percentage}%
                    </span>
                  </div>
                  <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 sm:h-2">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 90 ? 'bg-green-500' :
                        percentage >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issue Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {t("stakeholders.dataQuality.issueDistribution")}
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.issuesByType).map(([type, count]) => {
              const Icon = getIssueIcon(type);
              return (
                <div key={type} className="flex items-center justify-between p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <span className="text-xs sm:text-sm font-medium">
                      {t(`stakeholders.dataQuality.${type}`)}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Responsive Grid/Flex */}
      <div className="border-b border-gray-200 dark:border-zinc-800">
        {/* Mobile Grid Tabs */}
        <nav className="grid grid-cols-3 gap-2 p-2 sm:hidden">
          <button
            onClick={() => setActiveTab("issues")}
            className={`col-span-1 flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium rounded-lg transition ${
              activeTab === "issues"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{t("stakeholders.dataQuality.issues")}</span>
            {stats.openIssues > 0 && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                {stats.openIssues}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`col-span-1 flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium rounded-lg transition ${
              activeTab === "audit"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t("stakeholders.dataQuality.auditLog")}</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`col-span-1 flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium rounded-lg transition ${
              activeTab === "health"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t("stakeholders.dataQuality.dataHealth")}</span>
          </button>
        </nav>
        
        {/* Desktop Flex Tabs */}
        <nav className="hidden sm:flex gap-4">
          <button
            onClick={() => setActiveTab("issues")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "issues"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {t("stakeholders.dataQuality.issues")}
            {stats.openIssues > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                {stats.openIssues}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "audit"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            {t("stakeholders.dataQuality.auditLog")}
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "health"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            {t("stakeholders.dataQuality.dataHealth")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "issues" && renderIssuesTab()}
      {activeTab === "audit" && renderAuditTab()}
      {activeTab === "health" && renderHealthTab()}

      {/* Resolve Issue Modal */}
      {showResolveModal && selectedIssue && (
        <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("stakeholders.dataQuality.resolveIssue")}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.dataQuality.issue")}
                </label>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  {t(`stakeholders.dataQuality.${selectedIssue.type}`)} - {selectedIssue.stakeholderName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.dataQuality.resolution")}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.dataQuality.resolutionPlaceholder")}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedIssue(null);
                  setResolution("");
                }}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
              >
                {t("stakeholders.cancel")}
              </button>
              <button
                onClick={handleResolveIssue}
                disabled={!resolution}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition"
              >
                {t("stakeholders.dataQuality.markResolved")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityDashboard;