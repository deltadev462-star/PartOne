import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  FileText,
  Paperclip,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Filter,
  Download,
  ChevronRight,
  Phone,
  Mail,
  Video,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  X
} from "lucide-react";

const EngagementLog = ({
  stakeholders,
  engagementLogs,
  onLogEngagement,
  projects
}) => {
  const { t } = useTranslation();
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [attachments, setAttachments] = useState([]);

  const [logForm, setLogForm] = useState({
    stakeholderId: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    method: "meeting",
    owner: "",
    summary: "",
    nextSteps: "",
    sentimentScore: 50,
    engagementQuality: "neutral",
    keyTopics: [],
    actionItems: [],
    attachments: [],
    followUpRequired: false,
    followUpDate: "",
    notes: ""
  });

  const engagementMethods = [
    { value: "meeting", label: t("stakeholders.methods.meeting"), icon: Users },
    { value: "call", label: t("stakeholders.methods.call"), icon: Phone },
    { value: "email", label: t("stakeholders.methods.email"), icon: Mail },
    { value: "video", label: t("stakeholders.methods.video"), icon: Video },
    { value: "workshop", label: t("stakeholders.methods.workshop"), icon: FileText },
    { value: "presentation", label: t("stakeholders.methods.presentation"), icon: MessageSquare }
  ];

  const sentimentColors = {
    positive: "text-green-600 bg-green-50",
    neutral: "text-yellow-600 bg-yellow-50",
    negative: "text-red-600 bg-red-50"
  };

  const getSentimentFromScore = (score) => {
    if (score >= 70) return "positive";
    if (score >= 30) return "neutral";
    return "negative";
  };

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case "positive": return <ThumbsUp className="w-4 h-4" />;
      case "negative": return <ThumbsDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const handleLogSubmit = () => {
    const engagementData = {
      ...logForm,
      timestamp: new Date(`${logForm.date}T${logForm.time}`).toISOString(),
      sentiment: getSentimentFromScore(logForm.sentimentScore),
      attachments,
      id: editingLog?.id || Date.now()
    };

    onLogEngagement(engagementData);

    // Reset form
    setLogForm({
      stakeholderId: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      method: "meeting",
      owner: "",
      summary: "",
      nextSteps: "",
      sentimentScore: 50,
      engagementQuality: "neutral",
      keyTopics: [],
      actionItems: [],
      attachments: [],
      followUpRequired: false,
      followUpDate: "",
      notes: ""
    });
    setAttachments([]);
    setShowLogModal(false);
    setEditingLog(null);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const addActionItem = () => {
    const newItem = prompt(t("stakeholders.log.enterActionItem"));
    if (newItem) {
      setLogForm({
        ...logForm,
        actionItems: [...logForm.actionItems, { text: newItem, completed: false }]
      });
    }
  };

  const toggleActionItem = (index) => {
    const items = [...logForm.actionItems];
    items[index].completed = !items[index].completed;
    setLogForm({ ...logForm, actionItems: items });
  };

  const filteredLogs = engagementLogs.filter(log => {
    if (selectedStakeholder && log.stakeholderId !== selectedStakeholder) return false;
    if (filterMethod !== "all" && log.method !== filterMethod) return false;
    
    if (filterDateRange !== "all") {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      
      switch(filterDateRange) {
        case "today":
          if (logDate.toDateString() !== now.toDateString()) return false;
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < monthAgo) return false;
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (logDate < quarterAgo) return false;
          break;
      }
    }
    
    return true;
  });

  // Calculate engagement statistics
  const calculateEngagementStats = () => {
    const stats = {
      totalEngagements: filteredLogs.length,
      byMethod: {},
      averageSentiment: 0,
      sentimentTrend: [],
      topEngagedStakeholders: []
    };

    // Count by method
    engagementMethods.forEach(method => {
      stats.byMethod[method.value] = filteredLogs.filter(log => log.method === method.value).length;
    });

    // Calculate average sentiment
    if (filteredLogs.length > 0) {
      const totalSentiment = filteredLogs.reduce((sum, log) => sum + (log.sentimentScore || 50), 0);
      stats.averageSentiment = Math.round(totalSentiment / filteredLogs.length);
    }

    // Get sentiment trend (last 5 engagements)
    stats.sentimentTrend = filteredLogs
      .slice(-5)
      .map(log => ({
        date: new Date(log.timestamp).toLocaleDateString(),
        score: log.sentimentScore || 50
      }));

    // Top engaged stakeholders
    const engagementCounts = {};
    filteredLogs.forEach(log => {
      engagementCounts[log.stakeholderId] = (engagementCounts[log.stakeholderId] || 0) + 1;
    });
    
    stats.topEngagedStakeholders = Object.entries(engagementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([stakeholderId, count]) => ({
        stakeholder: stakeholders.find(s => s.id === stakeholderId),
        count
      }));

    return stats;
  };

  const stats = calculateEngagementStats();

  const exportLogs = () => {
    const csvContent = [
      ["Date", "Time", "Stakeholder", "Method", "Owner", "Summary", "Sentiment", "Follow Up Required", "Next Steps"],
      ...filteredLogs.map(log => {
        const stakeholder = stakeholders.find(s => s.id === log.stakeholderId);
        const date = new Date(log.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          stakeholder?.name || "",
          log.method,
          log.owner,
          log.summary,
          log.sentimentScore || "50",
          log.followUpRequired ? "Yes" : "No",
          log.nextSteps || ""
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engagement_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStakeholder}
            onChange={(e) => setSelectedStakeholder(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="">{t("stakeholders.log.allStakeholders")}</option>
            {stakeholders.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">{t("stakeholders.log.allMethods")}</option>
            {engagementMethods.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>

          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">{t("stakeholders.log.allTime")}</option>
            <option value="today">{t("stakeholders.log.today")}</option>
            <option value="week">{t("stakeholders.log.lastWeek")}</option>
            <option value="month">{t("stakeholders.log.lastMonth")}</option>
            <option value="quarter">{t("stakeholders.log.lastQuarter")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            title={t("stakeholders.log.export")}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("stakeholders.log.logEngagement")}
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.log.engagementSummary")}
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-zinc-400">
                {t("stakeholders.log.totalEngagements")}
              </span>
              <span className="text-2xl font-bold">{stats.totalEngagements}</span>
            </div>

            <div className="space-y-2">
              {engagementMethods.map(method => {
                const Icon = method.icon;
                const count = stats.byMethod[method.value] || 0;
                const percentage = stats.totalEngagements > 0 
                  ? Math.round(count / stats.totalEngagements * 100) 
                  : 0;

                return (
                  <div key={method.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{method.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="w-20 bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.log.sentimentAnalysis")}
          </h3>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-zinc-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${stats.averageSentiment * 3.52} 352`}
                  className={
                    stats.averageSentiment >= 70
                      ? "text-green-500"
                      : stats.averageSentiment >= 30
                      ? "text-yellow-500"
                      : "text-red-500"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{stats.averageSentiment}%</span>
                <span className="text-xs text-gray-500 dark:text-zinc-500">
                  {t("stakeholders.log.avgSentiment")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                {t("stakeholders.log.positive")}
              </span>
              <span className="font-medium">
                {filteredLogs.filter(l => l.sentimentScore >= 70).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-yellow-500" />
                {t("stakeholders.log.neutral")}
              </span>
              <span className="font-medium">
                {filteredLogs.filter(l => l.sentimentScore >= 30 && l.sentimentScore < 70).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                {t("stakeholders.log.negative")}
              </span>
              <span className="font-medium">
                {filteredLogs.filter(l => l.sentimentScore < 30).length}
              </span>
            </div>
          </div>

          {stats.sentimentTrend.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">
                {t("stakeholders.log.recentTrend")}
              </p>
              <div className="flex items-end gap-1 h-12">
                {stats.sentimentTrend.map((point, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${
                      point.score >= 70
                        ? "bg-green-500"
                        : point.score >= 30
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ height: `${(point.score / 100) * 48}px` }}
                    title={`${point.date}: ${point.score}%`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Engaged */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.log.topEngaged")}
          </h3>

          <div className="space-y-3">
            {stats.topEngagedStakeholders.length > 0 ? (
              stats.topEngagedStakeholders.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs">
                      {item.stakeholder?.name?.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.stakeholder?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {item.stakeholder?.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-zinc-500 text-sm py-4">
                {t("stakeholders.log.noEngagements")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Logs List */}
      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            const stakeholder = stakeholders.find(s => s.id === log.stakeholderId);
            const Method = engagementMethods.find(m => m.value === log.method)?.icon || MessageSquare;
            const sentiment = getSentimentFromScore(log.sentimentScore);

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                        {stakeholder?.name?.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {stakeholder?.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                          {stakeholder?.role} • {stakeholder?.organization}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Method className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-zinc-400">
                          {engagementMethods.find(m => m.value === log.method)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-zinc-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <Clock className="w-4 h-4 text-gray-500 ml-2" />
                        <span className="text-sm text-gray-600 dark:text-zinc-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sentimentColors[sentiment]}`}>
                        {getSentimentIcon(sentiment)}
                        <span>{log.sentimentScore}%</span>
                      </div>
                    </div>

                    {log.summary && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 dark:text-zinc-300">{log.summary}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-zinc-400">{log.owner}</span>
                      </div>

                      {log.followUpRequired && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 dark:text-orange-400">
                            {t("stakeholders.log.followUpRequired")}
                          </span>
                          {log.followUpDate && (
                            <span className="text-gray-600 dark:text-zinc-400">
                              {new Date(log.followUpDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      {log.attachments?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-zinc-400">
                            {log.attachments.length} {t("stakeholders.log.attachments")}
                          </span>
                        </div>
                      )}

                      {log.actionItems?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-zinc-400">
                            {log.actionItems.filter(i => i.completed).length}/{log.actionItems.length} {t("stakeholders.log.actionsComplete")}
                          </span>
                        </div>
                      )}
                    </div>

                    {log.nextSteps && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded">
                        <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                          {t("stakeholders.log.nextSteps")}:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-zinc-400">{log.nextSteps}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingLog(log);
                        setLogForm({
                          ...log,
                          date: new Date(log.timestamp).toISOString().split('T')[0],
                          time: new Date(log.timestamp).toTimeString().slice(0, 5)
                        });
                        setShowLogModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition"
                    >
                      <Edit className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-zinc-500">
              {t("stakeholders.log.noLogs")}
            </p>
          </div>
        )}
      </div>

      {/* Log Engagement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingLog ? t("stakeholders.log.editLog") : t("stakeholders.log.logEngagement")}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.log.stakeholder")}
                  </label>
                  <select
                    value={logForm.stakeholderId}
                    onChange={(e) => setLogForm({ ...logForm, stakeholderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">{t("stakeholders.log.selectStakeholder")}</option>
                    {stakeholders.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.log.method")}
                  </label>
                  <select
                    value={logForm.method}
                    onChange={(e) => setLogForm({ ...logForm, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  >
                    {engagementMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.log.date")}
                  </label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.log.time")}
                  </label>
                  <input
                    type="time"
                    value={logForm.time}
                    onChange={(e) => setLogForm({ ...logForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.log.owner")}
                  </label>
                  <input
                    type="text"
                    value={logForm.owner}
                    onChange={(e) => setLogForm({ ...logForm, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    placeholder={t("stakeholders.log.ownerPlaceholder")}
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.log.summary")}
                </label>
                <textarea
                  value={logForm.summary}
                  onChange={(e) => setLogForm({ ...logForm, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.log.summaryPlaceholder")}
                />
              </div>

              {/* Sentiment Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.log.sentimentScore")}: {logForm.sentimentScore}%
                </label>
                <div className="flex items-center gap-4">
                  <ThumbsDown className="w-5 h-5 text-red-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={logForm.sentimentScore}
                    onChange={(e) => setLogForm({ ...logForm, sentimentScore: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  <span>{t("stakeholders.log.veryNegative")}</span>
                  <span>{t("stakeholders.log.neutral")}</span>
                  <span>{t("stakeholders.log.veryPositive")}</span>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.log.nextSteps")}
                </label>
                <textarea
                  value={logForm.nextSteps}
                  onChange={(e) => setLogForm({ ...logForm, nextSteps: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.log.nextStepsPlaceholder")}
                />
              </div>

              {/* Follow Up */}
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={logForm.followUpRequired}
                    onChange={(e) => setLogForm({ ...logForm, followUpRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-zinc-300">
                    {t("stakeholders.log.followUpRequired")}
                  </span>
                </label>
                
                {logForm.followUpRequired && (
                  <input
                    type="date"
                    value={logForm.followUpDate}
                    onChange={(e) => setLogForm({ ...logForm, followUpDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.log.attachments")}
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 cursor-pointer hover:text-blue-500 transition"
                  >
                    <Paperclip className="w-5 h-5" />
                    <span className="text-sm">{t("stakeholders.log.clickToAttach")}</span>
                  </label>
                  
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                          <span className="text-sm">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(file.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setEditingLog(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
              >
                {t("stakeholders.cancel")}
              </button>
              <button
                onClick={handleLogSubmit}
                disabled={!logForm.stakeholderId || !logForm.owner || !logForm.summary}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition"
              >
                {editingLog ? t("stakeholders.log.updateLog") : t("stakeholders.log.saveLog")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementLog;